# Phase 14 — Multi-Project Concurrency

**One-liner**: Queue + scheduler so N projects run through the factory in parallel with workspace isolation, fair scheduling, and per-project resource quotas.

## Context (pre-phase code survey)

Per Phase 4 Lesson #1 ("read existing code before scoping"):

- **Today's factory is single-project**: `tools.js:setProjectDir(projectName)` mutates a module-level `_projectDir`. Two concurrent runs would race on this shared state.
- **Phase 6-A artifact store** is already per-project (`${PROJECT_DIR}/_artifacts/`). Concurrent writes from different projects don't conflict at the store level.
- **Phase 7-A memory layer** is global at the vault level but uses scope partitioning (`project:<id>`). Cross-project visibility is by-design; per-project writes don't conflict.
- **Phase 11-A cost-tracker** rolls up cross-project artifacts; per-project filtering already supported.
- **Phase 12-A admin substrate** uses scope `project:<id>` for thresholds/routing. Per-project config overrides are a future extension already anticipated.
- **Phase 13-A replay engine** validates single-project assumption (collector throws if a run spans multiple projects). Concurrent replays of different projects are safe.

**Gap to fill in 14-A**: a job queue + worker pool that:
1. Accepts job submissions (project_id + payload)
2. Schedules workers fairly (round-robin / priority / quota-aware)
3. Isolates each running job to its own working directory + project context
4. Persists queue state across restarts (filesystem-backed)
5. Reports worker availability + queue depth for the admin dashboard

## Design

```
incoming submissions:
  submitJob({ project_id, kind, payload, priority? })
       │
       ▼
  ┌──────────────────────────┐
  │  Queue (jsonl-backed)    │
  │  jobs/queue/<JOB-id>.json │
  └──────────┬───────────────┘
             │
             ▼  pop next eligible job (fair-scheduling policy)
  ┌──────────────────────────┐
  │  Scheduler (worker pool) │
  │  N workers, configurable │
  └──────────┬───────────────┘
             │
             ▼  worker leases a job, moves to in-flight
  ┌────────────────────────────────────────┐
  │  Worker context (per-job isolation):   │
  │    - dedicated workingDir              │
  │    - project_id stamped on artifacts   │
  │    - cost-tracker scoped to project    │
  │    - resource quotas enforced (budget) │
  └────────────────────────────────────────┘
             │
             ▼  on success: archive; on failure: retry or fail-permanent
  ┌──────────────────────────┐
  │  Result store            │
  │  jobs/done/<JOB-id>.json │
  └──────────────────────────┘
```

## Scope for this phase (14-A: queue + scheduler library)

Mirrors 5-A through 13-A pattern.

| Sub | What | Deliverable |
|---|---|---|
| 14-A.1 | `concurrency/types.js` — Job, JobState, SchedulerConfig, WorkerStatus shapes | ✅ |
| 14-A.2 | `concurrency/queue.js` — filesystem-backed JSONL queue: enqueue/peek/lease/complete/fail | ✅ |
| 14-A.3 | `concurrency/scheduler.js` — worker pool with fair scheduling (round-robin per-project) | ✅ |
| 14-A.4 | `concurrency/handler-registry.js` — register `kind → handler(job)` callbacks | ✅ |
| 14-A.5 | Smoke test — N projects × M jobs, fairness check, leasing semantics, retries | ✅ |
| 14-A.6 | `concurrency/README.md` + flag docs | ✅ |

**Out of scope for 14-A** (deferred to 14-B):

- Real factory job handlers (running pre_dev/dev/post_dev graphs)
- Per-project resource quotas wired to Phase 11-A cost tracker (max parallel jobs per project, max budget per worker)
- HTTP submission endpoint in `factory-dashboard/server/telemetry.mjs`
- React UI showing queue state + worker pool + per-project status
- Cross-process worker pool (today: single Node process; 14-B may add OS-process workers)
- Crash recovery semantics — partially-leased jobs after a process crash

## Why this scope is right

- **Filesystem-backed queue** = persistent across restarts, no DB dependency, debuggable via `ls jobs/queue/`.
- **In-process worker pool** for v1 — N concurrent async tasks, not OS processes. Simpler; isolation comes from per-job working directories.
- **Fair scheduling = round-robin per-project** — prevents one project flooding the factory and starving others. P1 (configurability) lets ops swap to priority/quota later.
- **Handler registry** = same dependency-injection pattern as Phase 9-A (`fixRouter`) and Phase 13-A (`nodeStubs`). Real handlers register; tests register stubs. Engine doesn't change.

## Phase close criteria

- ✅ `concurrency/` scaffolded
- ✅ Queue persistently stores jobs in `<workspaceRoot>/_jobs/queue/`
- ✅ Scheduler runs configurable parallelism (default: 2 workers)
- ✅ Round-robin scheduling proven via assertion: 4 projects × 2 jobs each = workers see all projects before any project's second job
- ✅ Lease semantics: a leased job moves to `in-flight/`, completion moves to `done/`, failure either retries or moves to `failed/`
- ✅ Smoke test: 4 projects × 3 jobs each, 2 workers, all complete without races
- ✅ `USE_JOB_QUEUE` flag documented (no runtime effect in 14-A)
- ✅ No changes to graph files, `tools.js`, telemetry.mjs, or any other module
- ✅ Phase docs: Plan (expanded), Status, Decisions (D136-Dxx), Lessons

## Decisions expected

- **D136**: Filesystem-backed queue (JSONL per state directory) over Redis/SQLite — zero-dep, debuggable
- **D137**: In-process async workers, not OS processes — sufficient for R&D band; OS isolation deferred to 14-B
- **D138**: Round-robin per-project as default fair-scheduling policy — prevents starvation, simple to reason about
- **D139**: Handler registry as dependency injection — same pattern as Phase 9-A / 13-A
- **D140**: Per-job working directory under `<workspace>/_jobs/work/<JOB-id>/` — isolated cwd per job
