import os from "node:os";
import path from "node:path";
import fs from "node:fs/promises";
import { createQueue } from "./queue.js";
import { createHandlerRegistry } from "./handler-registry.js";
import { runSchedulerOnce, pickNextJob } from "./scheduler.js";

function assert(c, m) { if (!c) throw new Error(`ASSERT: ${m}`); console.log(`  ✓ ${m}`); }

async function setupTmpRoot() {
  return await fs.mkdtemp(path.join(os.tmpdir(), "concurrency-"));
}

async function testQueueBasics() {
  console.log("[queue basics]");
  const root = await setupTmpRoot();
  try {
    const q = createQueue(root);
    const j1 = await q.enqueue({ project_id: "alpha", kind: "test" });
    const j2 = await q.enqueue({ project_id: "alpha", kind: "test" });
    const j3 = await q.enqueue({ project_id: "beta", kind: "test" });

    assert(j1.id === "JOB-0001", "first id is JOB-0001");
    assert(j3.id === "JOB-0003", "third id is JOB-0003");

    const queued = await q.listQueued();
    assert(queued.length === 3, "3 queued");

    const stats = await q.stats();
    assert(stats.queue === 3 && stats.done === 0, "stats reflect queue state");

    try { await q.enqueue({ kind: "test" }); throw new Error("no project_id should reject"); }
    catch (e) { assert(e.message.includes("project_id"), "missing project_id rejected"); }
    try { await q.enqueue({ project_id: "x" }); throw new Error("no kind should reject"); }
    catch (e) { assert(e.message.includes("kind"), "missing kind rejected"); }
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
}

async function testLeaseAtomicity() {
  console.log("[lease atomicity]");
  const root = await setupTmpRoot();
  try {
    const q = createQueue(root);
    const job = await q.enqueue({ project_id: "alpha", kind: "test" });

    // Two workers race to lease the same job — only one should succeed
    const [a, b] = await Promise.all([q.lease(job.id, "W-A"), q.lease(job.id, "W-B")]);
    const winners = [a, b].filter(Boolean);
    assert(winners.length === 1, `exactly one worker leases (got ${winners.length})`);
    assert(winners[0].leased_by === "W-A" || winners[0].leased_by === "W-B", "winner has leased_by set");
    assert(winners[0].attempt === 1, "attempt incremented to 1");

    const inflight = await q.listInFlight();
    assert(inflight.length === 1, "1 in-flight after lease");
    const queued = await q.listQueued();
    assert(queued.length === 0, "0 queued after lease");
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
}

async function testCompleteAndFail() {
  console.log("[complete + fail + retry]");
  const root = await setupTmpRoot();
  try {
    const q = createQueue(root);
    const j1 = await q.enqueue({ project_id: "alpha", kind: "test" });
    await q.lease(j1.id, "W-A");
    await q.complete(j1.id, { ok: true, output: "done" });
    let stats = await q.stats();
    assert(stats.done === 1 && stats.queue === 0 && stats["in-flight"] === 0, "complete moves to done");

    // Failure with retries available → requeue
    const j2 = await q.enqueue({ project_id: "beta", kind: "test", max_attempts: 2 });
    await q.lease(j2.id, "W-A");
    let r1 = await q.fail(j2.id, new Error("transient"));
    assert(r1.requeued, "first fail with retries → requeued");
    stats = await q.stats();
    assert(stats.queue === 1, "back in queue after requeue");

    // Second attempt also fails → permanent failed
    await q.lease(j2.id, "W-A");
    let r2 = await q.fail(j2.id, new Error("again"));
    assert(!r2.requeued, "second fail with no retries left → permanent");
    stats = await q.stats();
    assert(stats.failed === 1 && stats.queue === 0, "moved to failed");
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
}

async function testSchedulingPolicies() {
  console.log("[scheduling policies]");
  const now = Date.now();
  const j = (id, project_id, priority, delayMs) => ({
    id, project_id, priority, kind: "x", payload: {},
    max_attempts: 3, attempt: 0, state: "queued",
    created_at: new Date(now + delayMs).toISOString(),
  });

  const queue = [
    j("J-1", "alpha", 100, 0),
    j("J-2", "alpha", 10,  100),
    j("J-3", "beta",  50,  200),
    j("J-4", "beta",  50,  300),
  ];

  assert(pickNextJob(queue, "fifo").id === "J-1", "fifo: oldest first");
  assert(pickNextJob(queue, "priority").id === "J-2", "priority: lowest priority value first");
  // round_robin: project with oldest waiting job served first → alpha (J-1 created first)
  assert(pickNextJob(queue, "round_robin").id === "J-1", "round_robin: alpha (oldest waiting) first");
}

async function testFairnessEndToEnd() {
  console.log("[fairness end-to-end]");
  const root = await setupTmpRoot();
  try {
    const q = createQueue(root);
    const projects = ["alpha", "beta", "gamma", "delta"];

    // 4 projects × 3 jobs each, alpha jobs queued first, then beta, etc.
    for (const p of projects) {
      for (let i = 1; i <= 3; i++) {
        await q.enqueue({ project_id: p, kind: "stub", payload: { n: i } });
        await new Promise(r => setTimeout(r, 5)); // ensure distinct created_at timestamps
      }
    }

    const projectOrder = [];
    const registry = createHandlerRegistry();
    registry.register("stub", async (job) => {
      projectOrder.push(job.project_id);
      await new Promise(r => setTimeout(r, 5));   // simulate work
      return { ok: true };
    });

    const result = await runSchedulerOnce({
      queue: q, registry, workspaceRoot: root,
      config: { parallelism: 2, policy: "round_robin", poll_interval_ms: 10 },
    });

    assert(result.processed === 12, `12 jobs processed (got ${result.processed})`);
    assert(result.failed === 0, "0 failed");

    // First 4 jobs processed should hit each project once (round-robin proves fairness)
    const firstFour = projectOrder.slice(0, 4);
    const distinctProjects = new Set(firstFour);
    assert(distinctProjects.size === 4, `first 4 jobs span all 4 projects (got ${distinctProjects.size}: ${firstFour.join(",")})`);

    const stats = await q.stats();
    assert(stats.done === 12 && stats.queue === 0 && stats["in-flight"] === 0, "all 12 in done, queue empty");
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
}

async function testHandlerFailureAndRetry() {
  console.log("[handler failure + retry]");
  const root = await setupTmpRoot();
  try {
    const q = createQueue(root);
    await q.enqueue({ project_id: "alpha", kind: "flaky", max_attempts: 2 });

    let calls = 0;
    const registry = createHandlerRegistry();
    registry.register("flaky", async () => {
      calls += 1;
      if (calls < 2) throw new Error("transient");
      return { ok: true, calls };
    });

    const result = await runSchedulerOnce({
      queue: q, registry, workspaceRoot: root,
      config: { parallelism: 1, policy: "fifo", poll_interval_ms: 10 },
    });

    assert(result.processed === 1, "job eventually succeeded");
    assert(calls === 2, `handler called 2x (got ${calls})`);
    const stats = await q.stats();
    assert(stats.done === 1 && stats.failed === 0, "moved to done after retry");
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
}

async function testMissingHandler() {
  console.log("[missing handler]");
  const root = await setupTmpRoot();
  try {
    const q = createQueue(root);
    await q.enqueue({ project_id: "alpha", kind: "unknown", max_attempts: 1 });
    const registry = createHandlerRegistry();
    const result = await runSchedulerOnce({
      queue: q, registry, workspaceRoot: root,
      config: { parallelism: 1, poll_interval_ms: 10 },
    });
    assert(result.failed === 1, "missing handler → failed");
    const stats = await q.stats();
    assert(stats.failed === 1, "moved to failed/");
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
}

async function main() {
  try {
    await testQueueBasics();
    console.log("");
    await testLeaseAtomicity();
    console.log("");
    await testCompleteAndFail();
    console.log("");
    await testSchedulingPolicies();
    console.log("");
    await testFairnessEndToEnd();
    console.log("");
    await testHandlerFailureAndRetry();
    console.log("");
    await testMissingHandler();
    console.log("\n[smoke] OK");
  } catch (e) {
    console.error(`\n[smoke] FAILED: ${e.message}`);
    console.error(e.stack);
    process.exit(1);
  }
}

main();
