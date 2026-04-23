# Phase 12 — Status: 12-A COMPLETE ✅  (12-B DEFERRED)

**Phase started**: 2026-04-23
**Phase 12-A closed**: 2026-04-23
**Duration**: single session

## Subphase progress

| Sub | What | Status |
|---|---|---|
| 12-A.1 | `admin-substrate/types.js` — Role enum, ConfigEntry, FeatureFlag, AuditEntry shapes | ✅ done |
| 12-A.2 | `admin-substrate/registry.js` — explicit catalog of 7 configs + 8 feature flags | ✅ done |
| 12-A.3 | `admin-substrate/config-store.js` — atomic temp+rename writes, schema_version validation | ✅ done |
| 12-A.4 | `admin-substrate/feature-flags.js` — env-based read, snapshot, validators | ✅ done |
| 12-A.5 | `admin-substrate/roles.js` — `roleMeets`, `requireRole` integer-rank gating | ✅ done |
| 12-A.6 | `admin-substrate/audit.js` — append-only JSONL log with actor/action/target | ✅ done |
| 12-A.7 | Smoke test — 39 assertions across 6 test groups | ✅ done — all pass |
| 12-A.8 | `admin-substrate/README.md` + design decisions | ✅ done |
| 12-B | HTTP routes + React UI + Postgres migration + runtime flag toggle | ⏳ DEFERRED |

## What shipped

### `cognitive-engine/admin-substrate/types.js` (new, ~70 lines)
- 4 roles with integer rank: super_admin(3) > admin(2) > operator(1) > viewer(0)
- JSDoc shapes: `ConfigEntry`, `FeatureFlag`, `AuditEntry`
- 7 config categories: feature_flags, routing, pricing, registry, thresholds, providers, mcp
- `SCHEMA_VERSION = 1` for the substrate itself

### `cognitive-engine/admin-substrate/registry.js` (new, ~150 lines)
- 7 ConfigEntry rows catalogued: `pmd_registry`, `cost_thresholds`, `courier_routing`, `llm_routing`, `llm_prices`, `providers`, `mcp_servers`
- 8 FeatureFlag rows catalogued — one per Phase 4-11 feature flag
- Each entry has `min_role_view` + `min_role_edit` for role-gated access
- `getConfigEntry(id)`, `getFeatureFlag(envVar)`, `listConfigsForRole(role)`, `canRoleView()`, `canRoleEdit()` helpers

### `cognitive-engine/admin-substrate/config-store.js` (new, ~50 lines)
- `readConfig(id)` — returns `{entry, value}` from registry-known path
- `writeConfig(id, value)` — atomic temp-file + rename, schema_version validated
- `snapshotConfig(id)` — `{id, path, bytes, sha256, updated_at}` for diff/UI
- All operations registry-aware — unknown ids reject

### `cognitive-engine/admin-substrate/feature-flags.js` (new, ~40 lines)
- `readFlag(envVar)` — normalizes truthy values to "on"/"off"/null
- `snapshotAllFlags()` — returns all 8 flags with current + effective values
- `isKnownFlag()`, `listFlagEnvVars()` helpers

### `cognitive-engine/admin-substrate/roles.js` (new, ~35 lines)
- `roleMeets(actor, required)` — integer rank ≥ comparison
- `requireRole(actor, required, action)` — throws with `code: "ROLE_FORBIDDEN"` and required+actual fields
- `listRoles()`, `rankOf()` helpers

### `cognitive-engine/admin-substrate/audit.js` (new, ~40 lines)
- `appendAudit({actor, action, target, meta?, denied?})` — appends to `_admin-audit.jsonl`
- `readAudit({actor?, action?, target?, limit})` — most-recent-first, AND filters
- Path overridable via `ADMIN_AUDIT_LOG` env

### `cognitive-engine/admin-substrate/smoke-test.js` (new)
- **39 assertions across 6 test groups**:
  - registry (6): catalog counts match Phases 4-11 reality, lookups by id/envVar
  - roles (9): rank values, `roleMeets`, `requireRole` thrown error fields
  - role × config gates (6): operator can view, viewer cannot, super_admin-only edits
  - feature flags (8): snapshot, env value parsing (true/FALSE/unset), known/unknown
  - config round-trip (8): atomic write to temp path, schema_version validation, snapshot fields
  - audit log (7): append, filter by actor/action, missing-actor rejection
- **Real config files untouched** — round-trip test isolated to temp path

### `cognitive-engine/admin-substrate/README.md` (new)
- Full catalog table, role hierarchy diagram, API examples, atomic write contract, audit shape, design decisions, 12-B preview

### Unchanged
- `server/admin-keys.mjs` (Phase 2.5 Key Console) — untouched
- All 7 catalogued config files — untouched
- Graph files, `telemetry.mjs`, `tools.js`, all other modules — untouched
- Zero regression risk

## Smoke test highlight

```
[role × config gates]
  ✓ operator can view cost_thresholds
  ✓ viewer cannot view cost_thresholds
  ✓ super_admin can edit cost_thresholds
  ✓ admin cannot edit cost_thresholds (super_admin only)

[config round-trip]
  ✓ atomic write round-trips
  ✓ schema_version mismatch rejected

[audit log]
  ✓ 3 entries (got 3)
  ✓ newest first (bob)
  ✓ actor filter returns 2 alice entries
```

## Why 12-B deferred

12-B = HTTP routes + React UI + Postgres migration. Requires:

- **Server-side wiring**: extend `server/admin-keys.mjs` (or fold into a new `admin-config.mjs`) with route handlers per config + feature-flag endpoints. Touches production code.
- **UI work**: React pages in `factory-dashboard/src/pages/Admin/` — config browser, diff view, save+confirm flow, audit log viewer.
- **Postgres migration**: `config_settings` table with backward-read of JSON files as fallback during cutover.
- **Runtime flag toggle**: needs process-restart signaling for graph subprocesses that read env at boot. Non-trivial systemd dance.

Better to ship 12-A as the firm contract + tested library, and bundle UI + DB migration into 12-B as one coherent release.

## Feature-flag posture (P1 configurability-first)

| Flag | Default | Effect |
|---|---|---|
| `PRE_DEV_USE_GRAPH` | off | Phase 4 |
| `USE_MCP_TOOLS` | off | Phase 5 — awaits 5-B |
| `USE_ARTIFACT_STORE` | off | Phase 6 — awaits 6-B |
| `USE_MEMORY_LAYER` | off | Phase 7 — awaits 7-E |
| `USE_PARALLEL_DEV_GRAPH` | off | Phase 8 — awaits 8-B |
| `USE_VERIFY_INTEGRATION` | off | Phase 9 — awaits 9-B |
| `USE_COURIER` | off | Phase 10 — awaits 10-B |
| `USE_COST_TRACKER` | off | Phase 11 — awaits 11-B |
| (no new flag for 12-A) | — | substrate is library-only; 12-B will add `USE_ADMIN_API` if relevant |

## Phase 12-A exit criteria — met

- ✅ `admin-substrate/` scaffolded (types, registry, config-store, feature-flags, roles, audit, smoke-test, README)
- ✅ Registry catalogs all 7 known JSON configs + 8 feature flags from Phases 4-11
- ✅ Atomic write + schema_version validation working (verified via temp-path test)
- ✅ Role gating: 4-level hierarchy with integer-rank comparison
- ✅ Audit log appends + filters
- ✅ **39 smoke-test assertions all pass**
- ✅ Real config files NOT modified (round-trip test isolated to temp paths)
- ✅ No changes to admin-keys.mjs, graph files, telemetry.mjs, or any catalogued config
- ✅ Phase docs: Plan (expanded), Status, Decisions, Lessons
- ⏳ 12-B HTTP routes + React UI + Postgres migration deferred

Phase 12-A is **wired, tested, and ready**. 12-B builds the operator-facing layer on top.
