# Phase 12 — Lessons Learned

Phase 12-A closed: 2026-04-23. Duration: single session.

## What surprised us

1. **Atomic writes against the registry path mutated the real config file mid-test.** First smoke-test draft called `writeConfig("cost_thresholds", original)` to verify round-trip. JSON.stringify normalized `5.00` → `5` (no trailing zero in JSON), which the test passed but the on-disk file changed. Caught only by `git status` post-test. Fix: temporarily reassign the registry entry's path to a temp file, restore in `finally`. Lesson: smoke tests touching the real catalog need to isolate writes.

2. **`Object.freeze(array)` doesn't freeze the elements.** Frozen the `CONFIG_ENTRIES` array; element objects remained mutable. Used this for the temp-path swap-and-restore in the test. In production code this is a footgun — anyone with the array reference can mutate entries. Mitigation for 12-B: either deep-freeze or pass copies out of the registry.

3. **Phases 4-11 left an extraordinary amount of pre-existing substrate.** Pre-phase code survey turned up: 7 JSON config files, 8 USE_X env flags, 1 already-shipped admin server (admin-keys.mjs), Phase 2.5's actor convention (`X-Remote-User`), an existing `keys.js` with audit log pattern. Phase 12-A was mostly a catalog + a handful of helpers — most of the "admin module" was already built piecemeal across 7 phases.

4. **Role gating fell out of `min_role_view` + `min_role_edit` per entry, not a separate ACL file.** Initially considered an ACL config separate from the registry. Inlining the role minimums kept the catalog as one self-contained source. One file, no joins.

## What to do differently

1. **Add a `.gitignore` rule for `_admin-audit.jsonl`** in 12-B. Audit logs shouldn't be committed; they're per-VM ops history. Today the underscore prefix is custom; explicit ignore is safer.

2. **Smoke tests that touch real configs need a guard.** A `git status` check at the end of `node admin-substrate/smoke-test.js` would have flagged the bug immediately. Consider adding to a `tools/smoke-all.sh` that runs every module's smoke test AND verifies clean working tree.

3. **The 7-config + 8-flag count isn't future-proof.** Phase 13 (Replay) will add new configs. The smoke test asserts `=== 7` and `=== 8` — it'll need bumping. Better: assert `>= 7` and `>= 8` so the test stays stable as the catalog grows. (Will fix in 12-B PR or as a tiny follow-up.)

## What feeds next phases

### Phase 12-B — UI + HTTP + Postgres
- HTTP routes wrap `readConfig`/`writeConfig`/`snapshotConfig`/`snapshotAllFlags`/`appendAudit`/`readAudit`.
- React Admin pages use the role gates client-side too (defense in depth — server is the source of truth).
- Postgres `config_settings` table mirrors registry shape; backward-read of JSON files during migration window.
- Runtime feature-flag toggle endpoint with systemd-restart signaling.
- Diff view for config edits (using `snapshotConfig` sha as the "before" anchor).

### Phase 11-B — Cost Dashboard UI
- `cost-thresholds` is now editable via this substrate. Cost dashboard's threshold-adjust UI calls 12-B's `writeConfig` endpoint.
- Same pattern for `courier-routing` (alert channel changes).

### Phase 10-B — Courier wiring
- `courier-routing.json` editable via admin UI. Operators tune routes without code changes.
- `appendAudit({action: "config.update", target: "courier_routing"})` integrates naturally.

### Phase 5-B — MCP graph integration
- `mcp_servers` config editable via UI. Operators enable/disable servers per environment.

### Phase 14 — Multi-Project Concurrency
- Likely adds per-project config overrides. Registry expands to support `scope: project:<id>` per-entry. The `min_role_view`/`min_role_edit` model already supports scope-aware ACLs — just add a new field.

### Phase 15 — Self-Improvement Loop
- Agents proposing config changes route through admin substrate as `actor: "agent:<name>"`. Same audit log captures human and agent edits.
- Role hierarchy may need a fifth tier: `proposer` (can suggest but not commit). Easy to insert.

### Phase 19 — Customer Portal
- Customer-facing settings (delivery email, repository name, etc.) become a new config category with `min_role_edit: "customer"` — yet another role insertion the rank model handles cleanly.

## Stats

- **1 session**
- **$0.00 spent** (no LLM calls)
- **0 new dependencies** (uses node built-ins only)
- **8 files created**: `admin-substrate/{types,registry,config-store,feature-flags,roles,audit,smoke-test,README}.js|.md`
- **1 file inadvertently modified during testing → restored via `git checkout`**: `configs/cost-thresholds.json`
- **0 files modified** as final state: no changes to admin-keys.mjs, graph files, telemetry.mjs, or any catalogued config
- **4 phase docs**: Plan (expanded from sketch), Status, Decisions, Lessons
- **6 Decisions**: D125-D130

## Phase 12-A exit criteria — met

- ✅ `admin-substrate/types.js` — Role hierarchy, ConfigEntry/FeatureFlag/AuditEntry shapes
- ✅ `admin-substrate/registry.js` — 7 configs + 8 flags catalogued explicitly
- ✅ `admin-substrate/config-store.js` — atomic write + schema_version validation
- ✅ `admin-substrate/feature-flags.js` — env-based snapshot
- ✅ `admin-substrate/roles.js` — integer-rank `roleMeets`/`requireRole`
- ✅ `admin-substrate/audit.js` — append-only JSONL with filter
- ✅ Smoke test — **39 assertions all pass**
- ✅ Real config files **unchanged** in final state (smoke test verified)
- ✅ Zero changes to admin-keys.mjs, graph files, telemetry.mjs, or any catalogued config
- ⏳ 12-B HTTP routes + React UI + Postgres migration deferred

Phase 12-A is **wired, tested, and ready**. 12-B builds the operator UI on top of this contract.
