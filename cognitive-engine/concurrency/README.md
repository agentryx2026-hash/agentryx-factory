# Concurrency Engine (Phase 14-A)

Filesystem-backed job queue + worker pool for running N projects through the factory in parallel with workspace isolation and fair scheduling.

## Status: Phase 14-A scaffolding

28 smoke-test assertions pass. Round-robin fairness across 4 projects × 3 jobs verified end-to-end. **No real factory job handlers wired** — 14-B registers `pre_dev`, `dev`, `post_dev` handlers and adds HTTP submission.

## Files

- `types.js` — `Job`, `JobState`, `SchedulerConfig`, `WorkerStatus`, `JobHandler` shapes
- `queue.js` — filesystem-backed JSONL queue: `enqueue` / `lease` / `complete` / `fail` / `stats`
- `handler-registry.js` — kind → handler dependency-injection (matches Phase 9-A `fixRouter` pattern)
- `scheduler.js` — `runSchedulerOnce` worker pool + `pickNextJob` policy (round_robin/fifo/priority)
- `smoke-test.js` — 28 assertions across queue basics, lease atomicity, complete/fail/retry, policies, fairness, missing-handler

## Layout

```
<workspace_root>/_jobs/
  ├── _seq                         monotonic id counter
  ├── queue/
  │   └── JOB-0042.json            pending jobs
  ├── in-flight/
  │   └── JOB-0041.json            leased to a worker
  ├── done/
  │   └── JOB-0001.json            completed
  ├── failed/
  │   └── JOB-0007.json            exhausted retries
  └── work/
      ├── JOB-0041/                per-job working dir (isolated cwd)
      └── JOB-0042/
```

Each state transition is an atomic write+rename. POSIX guarantees readers see either the old or new state, never a partial file. Two workers racing to lease the same job: only one succeeds (the other gets ENOENT/EEXIST and tries the next job).

## Job lifecycle

```
enqueue ──→ queue/<JOB-id>.json
                │
                │ lease(jobId, workerId)  — atomic write+unlink
                ▼
         in-flight/<JOB-id>.json
                │
                │ handler(job, ctx) — returns success or throws
                ▼
   ┌──── success ───→ complete(jobId, result)  ─→ done/<JOB-id>.json
   │
   └──── failure ───→ fail(jobId, error)
                          │
                          ├──── attempt < max_attempts ──→ requeued (back to queue/)
                          │
                          └──── attempts exhausted ──→ failed/<JOB-id>.json
```

## Scheduling policies

| Policy | Picks |
|---|---|
| `round_robin` (default) | Project with FEWEST served jobs; ties → oldest queued first. Prevents starvation. |
| `fifo` | Strict oldest-first. Ignores project. |
| `priority` | Lowest `priority` value first. Ties → oldest. |

`servedCounts` is a Map<project_id, number> the scheduler maintains across worker leases — incremented at lease time so other workers see the updated state for their next pick. This makes fairness work even with N concurrent workers.

## API

```js
import { createQueue } from "./concurrency/queue.js";
import { createHandlerRegistry } from "./concurrency/handler-registry.js";
import { runSchedulerOnce } from "./concurrency/scheduler.js";

const q = createQueue("/path/to/workspace");

// Enqueue jobs
await q.enqueue({ project_id: "todo-app", kind: "pre_dev", payload: { task: "..." } });
await q.enqueue({ project_id: "blog", kind: "dev", priority: 10 });

// Register handlers (real or stub)
const registry = createHandlerRegistry();
registry.register("pre_dev", async (job, { workingDir, worker_id }) => {
  // run pre_dev_graph.js here in 14-B
  return { artifacts_written: 5 };
});

// Drain the queue (returns when empty + no in-flight)
const result = await runSchedulerOnce({
  queue: q,
  registry,
  workspaceRoot: "/path/to/workspace",
  config: { parallelism: 4, policy: "round_robin", poll_interval_ms: 100 },
});
// result = { processed: 12, failed: 0, workers: [{worker_id, jobs_done, jobs_failed, ...}] }
```

## Fairness proof (smoke test)

```
Setup:    4 projects × 3 jobs each, enqueued in alpha→beta→gamma→delta order
Workers:  2 (parallelism=2)
Policy:   round_robin

Assertion: first 4 jobs leased span all 4 distinct projects
Result:    ✓ alpha,beta,gamma,delta — fairness confirmed across workers
```

## Smoke test summary

```
$ node concurrency/smoke-test.js
[queue basics]              ✓ 6 (id assignment, listQueued, stats, validation)
[lease atomicity]           ✓ 5 (only one of two racing leases wins; in-flight count correct)
[complete + fail + retry]   ✓ 5 (complete → done; first fail requeues; final fail moves to failed/)
[scheduling policies]       ✓ 3 (fifo, priority, round_robin all pick correct job)
[fairness end-to-end]       ✓ 4 (12 jobs processed, 0 failed, first 4 span all 4 projects)
[handler failure + retry]   ✓ 3 (transient failure retried, succeeds on second attempt)
[missing handler]           ✓ 2 (missing handler fails job, moves to failed/)

[smoke] OK  — 28 assertions
```

## Feature flag

```
USE_JOB_QUEUE=true        # Phase 14-B onwards: factory submissions go through queue
                          # Phase 14-A: no runtime effect; library only
```

## Design decisions

- **Filesystem-backed JSONL** (D136) — zero dependencies, debuggable via `ls _jobs/queue/`, atomic rename across state directories
- **In-process async workers** (D137) — sufficient for v1; OS-process isolation via worker_threads or child_process deferred to 14-B
- **Round-robin per-project** (D138) — prevents one project from starving others; switchable to fifo/priority via config
- **Handler registry as DI** (D139) — same pattern as Phase 9-A `fixRouter`, Phase 13-A `nodeStubs`. Tests inject stubs; production registers real handlers
- **Per-job working dir** (D140) — `_jobs/work/<JOB-id>/` isolated cwd per job; cleaned up by ops policy (not deleted automatically in 14-A)

## Rollback

14-A has no runtime hooks. The library exists but nothing calls it. Removal = deleting the directory.

## What 14-B adds

- Real factory handlers: `register("pre_dev", spawnPreDevGraph)`, `register("dev", spawnDevGraph)`, etc.
- HTTP submission endpoint in `factory-dashboard/server/telemetry.mjs` (`POST /api/factory/queue`)
- React UI showing queue depth, in-flight, recent done/failed, per-project status
- Per-project quota enforcement: max parallel jobs per project (e.g. todo-app limited to 1 worker)
- Cost-tracker integration: pre-flight budget check via Phase 11-A `getRollup` before lease
- Crash recovery: detect orphan jobs in `in-flight/` after restart, requeue them
- Optional: OS-process worker pool (worker_threads or child_process) for true isolation
