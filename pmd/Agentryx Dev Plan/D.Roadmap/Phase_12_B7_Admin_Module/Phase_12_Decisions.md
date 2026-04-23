# Phase 12 — Decisions Log

## D125 — Substrate as a library; HTTP routes deferred to 12-B

**What**: Phase 12-A ships `cognitive-engine/admin-substrate/` as pure library code. No HTTP routes added to `server/admin-keys.mjs` or any other server file.

**Why**:
- **Discipline matches Phases 5-A through 11-A** — every scaffolding subphase has been library-only, with HTTP/UI in the B subphase. Consistency reduces surprise.
- **Contract-first**: get the registry shape, role gates, and audit log right before committing to URL paths.
- **Touching `admin-keys.mjs` is production code** — Phase 2.5 Key Console runs in production today on port 4402. Any change risks regressing key management.

## D126 — Registry as code catalog, not auto-discovered

**What**: `registry.js` exports `CONFIG_ENTRIES` as an explicit `Object.freeze`-d array. Adding a new config file = editing this array. No filesystem scan, no globbing.

**Why**:
- **Reviewability**: every entry was an intentional decision. A PR adding `configs/foo.json` AND a registry row is reviewable as one unit.
- **Role gates per config**: discovery can't infer who's allowed to edit `cost_thresholds` vs `mcp_servers`. Code does.
- **Schema versioning per entry**: a code row carries `schema_version: 1`. Discovery would need a separate metadata file, doubling complexity.
- **Grep-friendly**: `grep -n cost_thresholds registry.js` finds everything. Auto-discovery requires reasoning about resolution.

**Tradeoff**: forgetting to add a registry entry = config not visible in admin UI. Caught by review or by the smoke test that asserts catalog count == 7.

## D127 — Atomic writes via temp-file + rename

**What**: `writeConfig` writes to `<path>.tmp.<random>` first, then `fs.rename` to the real path.

**Why**:
- **POSIX rename is atomic on the same filesystem.** Readers always see either the old file or the new file, never a half-written intermediate.
- **Process kill safety**: if the admin process dies mid-write, the real config is unchanged; only the orphan `.tmp.*` file remains (cleanable later).
- **Concurrency safety against routing/cost/courier readers**: those modules `fs.readFile` the real path, never the temp.
- **Same pattern as Phase 6-A artifact `index.jsonl` appends** (which use `appendFile`, technically also append-only-atomic on Linux). Consistent file-write discipline across the codebase.

**Tradeoff**: not atomic across filesystems. We don't expect cross-filesystem config edits; if it ever matters, the rename will fail loudly.

## D128 — Role hierarchy is integer rank

**What**: `ROLE_RANK = {super_admin: 3, admin: 2, operator: 1, viewer: 0}`. `roleMeets(a, b)` is `a_rank >= b_rank`.

**Why**:
- **B7 spec is hierarchical** (super_admin > admin > operator > viewer). Integer comparison fits perfectly.
- **O(1) check**, no graph traversal, no permission-set union.
- **Easy to extend**: insert a new rank between admin (2) and operator (1) by re-numbering. Or add a new top role (super_admin_god, rank 4) without breaking existing `requireRole(actor, "super_admin")` calls.
- **Unknown role denies**: `ROLE_RANK[unknown]` is `undefined`, treated as -1. Default-deny posture.

## D129 — Audit log is JSONL at `_admin-audit.jsonl`

**What**: Audit entries appended one-per-line to `_admin-audit.jsonl` in repo root (overridable via `ADMIN_AUDIT_LOG`).

**Why**:
- **Same JSONL append-only pattern** as Phase 6-A artifacts and Phase 7-A memory observations. One mental model.
- **No DB dependency**: works on any factory VM out of the box. Phase 12-B may mirror to Postgres for cross-VM admin views.
- **Tail-friendly for ops**: `tail -f _admin-audit.jsonl | jq` shows live admin actions.
- **Underscore prefix excluded from `git status` views typically**: prevents accidental commit (though `.gitignore` rule should be added in 12-B).

**Tradeoff**: large logs need rotation. Phase 12-B or a future ops phase adds rotation; today it grows unbounded but admin actions are infrequent enough that this isn't pressing.

## D130 — Feature flags are READ-ONLY in 12-A

**What**: `feature-flags.js` exposes `readFlag()` and `snapshotAllFlags()`. No write/toggle API in 12-A.

**Why**:
- **Toggling requires re-reading env in graph subprocesses**, which only re-read at startup. Real toggle = restart strategy.
- **Two paths for restart**: (a) systemd `Restart=on-modify` + writing a sentinel file, (b) IPC signal (SIGHUP) handlers in graph processes. Both are non-trivial.
- **12-A is for showing operators what's currently set.** Flipping is a 12-B concern with the runtime-restart story.
- **Audit-log requirement**: when toggle does land, every flip must be audited. Substrate is ready — `appendAudit({action: "flag.toggle", target: "USE_MCP_TOOLS", meta: {from: "off", to: "on"}})`.
