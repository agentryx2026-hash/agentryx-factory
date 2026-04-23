import path from "node:path";
import fs from "node:fs/promises";
import crypto from "node:crypto";
import { isValidPolicy, nowIso } from "./types.js";

/**
 * Pick the next eligible job from a queued list per the scheduling policy.
 * Returns null if no jobs are eligible.
 *
 * For round_robin, `state.servedCounts` is a Map<project_id, number> of jobs
 * already leased per project — picks the project with the LOWEST served count
 * (ties broken by oldest queued job).
 *
 * @param {Array<import("./types.js").Job>} queued
 * @param {string} policy
 * @param {{servedCounts?: Map<string,number>}} state
 * @returns {import("./types.js").Job|null}
 */
export function pickNextJob(queued, policy, state = {}) {
  if (queued.length === 0) return null;
  if (policy === "fifo") {
    return [...queued].sort((a, b) => a.created_at < b.created_at ? -1 : 1)[0];
  }
  if (policy === "priority") {
    return [...queued].sort((a, b) => (a.priority - b.priority) || (a.created_at < b.created_at ? -1 : 1))[0];
  }
  // round_robin: per-project served counts decide; pick project with smallest count first
  const buckets = new Map();
  for (const j of queued) {
    if (!buckets.has(j.project_id)) buckets.set(j.project_id, []);
    buckets.get(j.project_id).push(j);
  }
  for (const [, jobs] of buckets) jobs.sort((a, b) => a.created_at < b.created_at ? -1 : 1);
  const served = state.servedCounts || new Map();
  // Sort buckets by served count ASC, then by oldest queued job ASC
  const sortedBuckets = [...buckets.entries()].sort((a, b) => {
    const sa = served.get(a[0]) ?? 0;
    const sb = served.get(b[0]) ?? 0;
    if (sa !== sb) return sa - sb;
    return a[1][0].created_at < b[1][0].created_at ? -1 : 1;
  });
  return sortedBuckets[0][1][0];
}

/**
 * Run a worker pool against a queue + handler registry until the queue empties
 * AND all in-flight jobs complete. Returns when drained.
 *
 * For 14-A: in-process async workers; no OS process isolation.
 *
 * @param {object} params
 * @param {ReturnType<import("./queue.js").createQueue>} params.queue
 * @param {ReturnType<import("./handler-registry.js").createHandlerRegistry>} params.registry
 * @param {import("./types.js").SchedulerConfig} [params.config]
 * @param {string} params.workspaceRoot                 for per-job working dir under <root>/_jobs/work/<JOB-id>/
 * @param {boolean} [params.drainOnly]                  if true, exit when queue + in-flight both empty
 * @returns {Promise<{processed: number, failed: number, workers: import("./types.js").WorkerStatus[]}>}
 */
export async function runSchedulerOnce({ queue, registry, config = {}, workspaceRoot, drainOnly = true }) {
  if (!queue) throw new Error("runSchedulerOnce: queue required");
  if (!registry) throw new Error("runSchedulerOnce: registry required");
  if (!workspaceRoot) throw new Error("runSchedulerOnce: workspaceRoot required");

  const parallelism = Math.max(1, config.parallelism ?? 2);
  const policy = isValidPolicy(config.policy) ? config.policy : "round_robin";
  const pollInterval = config.poll_interval_ms ?? 50;

  const workers = Array.from({ length: parallelism }, (_, i) => ({
    worker_id: `W-${i + 1}-${crypto.randomBytes(2).toString("hex")}`,
    state: "idle",
    jobs_done: 0,
    jobs_failed: 0,
  }));

  let processed = 0;
  let failed = 0;
  let stop = false;
  // Shared per-project served counts — drives round-robin fairness across workers
  const servedCounts = new Map();

  async function workerLoop(w) {
    while (!stop) {
      const queuedJobs = await queue.listQueued();
      if (queuedJobs.length === 0) {
        const inflight = await queue.listInFlight();
        if (drainOnly && inflight.length === 0) { w.state = "shutdown"; return; }
        await new Promise(r => setTimeout(r, pollInterval));
        continue;
      }
      const next = pickNextJob(queuedJobs, policy, { servedCounts });
      if (!next) { await new Promise(r => setTimeout(r, pollInterval)); continue; }

      const leased = await queue.lease(next.id, w.worker_id);
      if (!leased) { continue; }   // another worker beat us — try again

      // Increment served count immediately on successful lease so other workers
      // see the updated count for their next pick.
      servedCounts.set(leased.project_id, (servedCounts.get(leased.project_id) ?? 0) + 1);

      w.state = "busy";
      w.current_job_id = leased.id;
      w.current_project_id = leased.project_id;

      const handler = registry.get(leased.kind);
      if (!handler) {
        await queue.fail(leased.id, new Error(`no handler registered for kind '${leased.kind}'`));
        w.jobs_failed += 1;
        failed += 1;
        w.state = "idle";
        continue;
      }

      const workingDir = path.join(workspaceRoot, "_jobs", "work", leased.id);
      try {
        await fs.mkdir(workingDir, { recursive: true });
        const result = await handler(leased, { workingDir, worker_id: w.worker_id });
        await queue.complete(leased.id, result);
        w.jobs_done += 1;
        processed += 1;
      } catch (err) {
        const failResult = await queue.fail(leased.id, err);
        if (failResult.requeued) {
          // try again in a future iteration; not counted as failed yet
        } else {
          w.jobs_failed += 1;
          failed += 1;
        }
      }
      w.state = "idle";
      w.current_job_id = undefined;
      w.current_project_id = undefined;
    }
  }

  await Promise.all(workers.map(workerLoop));
  return { processed, failed, workers };
}
