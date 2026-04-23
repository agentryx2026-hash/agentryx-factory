# Phase 14 — Lessons Learned

Phase 14-A closed: 2026-04-23. Duration: single session.

## What surprised us

1. **Round-robin "by oldest bucket timestamp" silently degrades to FIFO when jobs are enqueued in project order.** First implementation sorted buckets by their oldest queued job's `created_at`. If alpha enqueued first, alpha's oldest was always older than beta's, so alpha was always picked. Smoke test caught this with a sharp assertion ("first 4 jobs span all 4 distinct projects"). Lesson: round-robin needs a true round-robin signal — number-of-times-served per project, not implicit timestamps.

2. **Atomic POSIX rename + per-state directories is a beautiful primitive.** `lease`, `complete`, `fail` are all "write to dst, unlink src." No file locks, no transactions, no DB. Two workers racing to lease: the loser's `writeFile({flag:"wx"})` fails with EEXIST, and they try the next job. The whole concurrency model fits in one paragraph.

3. **Sharing `servedCounts` Map across async workers in the same process is trivial** because Node's event loop guarantees no two `pickNextJob` calls run truly in parallel. The Map is read+updated synchronously between awaits. If 14-B moves to OS processes, `servedCounts` would need to migrate to the filesystem (compute from `done/` + `failed/` counts) or to a shared store.

4. **The handler registry pattern keeps appearing.** Phase 9-A `fixRouter`, Phase 13-A `nodeStubs`, now Phase 14-A `handlerRegistry`. All three: caller passes a function that the engine calls at the right moment. No global state, no module-level side effects. Worth codifying as a "dependency injection" convention going forward — likely Phase 15 (Self-Improvement) and Phase 18 (Marketplace) will use it again.

## What to do differently

1. **Handler timeouts are unspecified.** A handler that hangs forever blocks its worker indefinitely. 14-B should add a configurable per-kind timeout — wrap the `await handler(...)` in `Promise.race([handler(...), timeoutPromise])` with sensible default (e.g., 5 minutes) and per-kind override.

2. **No cleanup of `_jobs/work/<JOB-id>/` directories.** They accumulate forever in 14-A. 14-B should add a sweep policy: delete on done, or after N days, or up to a max-disk-usage threshold. Track in 14-B's plan.

3. **Lease metadata could be more atomic.** Today: write to `in-flight/`, then unlink from `queue/`. If process dies between these, both files exist briefly. A recovery script can detect this and unlink the queue copy. Or: rename within same filesystem (single syscall) and rewrite metadata in `in-flight/` after. Trade-off: rewrite means an extra read+write. Defer to 14-B with crash recovery.

## What feeds next phases

### Phase 14-B (deferred) — production wiring
- Real factory handlers that spawn `pre_dev_graph.js`, `dev_graph.js`, `post_dev_graph.js` as child processes
- HTTP submission endpoint in `factory-dashboard/server/telemetry.mjs` (`POST /api/factory/queue`)
- React UI: queue depth, worker pool, per-project status, history of done/failed
- Per-project quotas wired to Phase 11-A cost-tracker (max parallel + max budget)
- Crash recovery for orphan in-flight jobs
- Handler timeouts + per-kind overrides
- Worker dir cleanup policy

### Phase 11-B — Cost Dashboard
- Pre-flight budget check for queued jobs: scheduler can call `cost-tracker/getRollup` and refuse to lease if project is over `hard_cap_usd`. Direct integration.

### Phase 12-B — Admin UI
- Admin panel adds "Job Queue" tab: pause/resume queue, kill in-flight job, change parallelism, switch policy.
- Audit log for admin actions wraps queue operations.

### Phase 13-B — Replay
- Replay jobs themselves can go through the queue. `kind: "replay"` with payload `{run_id, replay_from_artifact_id}` + handler that calls `executeReplay(plan, ctx)`.

### Phase 15 — Self-Improvement Loop
- Self-improvement experiments enqueue replay jobs in batch. Round-robin fairness ensures one experiment doesn't starve real factory work.

### Phase 18 — Pipeline Module Marketplace
- Modules can register new handler kinds. Marketplace install = registry.register call.
- Per-kind quotas (modules can declare resource needs upfront).

### Phase 19 — Customer Portal
- Customer submission → `submitJob({project_id: customer_id, ...})` from the portal endpoint.
- Multi-tenant fairness: round-robin per project_id naturally extends to per customer.

## Stats

- **1 session**
- **$0.00 spent** (all stubs, no LLM calls)
- **0 new dependencies** (uses node built-ins only)
- **5 files created**: `concurrency/{types, queue, handler-registry, scheduler, smoke-test, README}.js|.md` (6 files)
- **0 files modified**: graph files, tools.js, telemetry.mjs, all other modules untouched
- **4 phase docs**: Plan (expanded from sketch), Status, Decisions, Lessons
- **5 Decisions**: D136-D140

## Phase 14-A exit criteria — met

- ✅ `concurrency/types.js` — full type system
- ✅ `concurrency/queue.js` — atomic enqueue/lease/complete/fail with race-safety
- ✅ `concurrency/handler-registry.js` — dependency-injection registration
- ✅ `concurrency/scheduler.js` — N-worker pool + 3 policies + per-job working dir
- ✅ Smoke test — **28 assertions all pass** including fairness end-to-end
- ✅ Bug caught + fixed during testing (round-robin via servedCounts)
- ✅ Zero changes to graph files, tools.js, telemetry.mjs, or any other module
- ✅ Phase docs: Plan (expanded), Status, Decisions, Lessons

Phase 14-A is **wired, tested, and ready**. Engine substrate firm — 14-B builds production wiring (real handlers, HTTP, UI, quotas, crash recovery).
