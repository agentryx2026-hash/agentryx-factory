# Admin Substrate (Phase 12-A)

Library for the B7 Admin Module — role-gated read/write access to factory config files + feature flag enumeration + audit log. **Substrate only**: HTTP routes and React UI live in Phase 12-B.

See `pmd/Agentryx Dev Plan/B.Agentryx Edge/B7_Admin_Operations_Module.md` for the full B7 spec this implements.

## Status: Phase 12-A scaffolding

39 smoke-test assertions pass. **No HTTP routes yet** (12-B extends `server/admin-keys.mjs`). **No UI yet** (12-B adds React Admin pages).

## Files

- `types.js` — Role enum (`super_admin > admin > operator > viewer`), `ConfigEntry`, `FeatureFlag`, `AuditEntry` shapes
- `registry.js` — explicit code catalog of 7 configs + 8 feature flags
- `config-store.js` — atomic read/write for registered configs, `schema_version` validation
- `feature-flags.js` — enumerate flags, read current `process.env` values
- `roles.js` — `roleMeets`, `requireRole`, integer-rank comparison
- `audit.js` — append-only `_admin-audit.jsonl` log with actor + action + target
- `smoke-test.js` — 39 assertions across registry, roles, gates, flags, config CRUD, audit

## Catalog (7 configs + 8 feature flags)

### Configs
| id | category | view min | edit min | source phase |
|---|---|---|---|---|
| `pmd_registry` | registry | operator | admin | Phase 4 |
| `cost_thresholds` | thresholds | operator | super_admin | Phase 11-A |
| `courier_routing` | routing | operator | admin | Phase 10-A |
| `llm_routing` | routing | operator | super_admin | Phase 2 |
| `llm_prices` | pricing | operator | super_admin | Phase 2 |
| `providers` | providers | operator | super_admin | Phase 2.5 |
| `mcp_servers` | mcp | operator | admin | Phase 5-A |

### Feature flags
| env_var | owning phase |
|---|---|
| `PRE_DEV_USE_GRAPH` | Phase 4 |
| `USE_MCP_TOOLS` | Phase 5 |
| `USE_ARTIFACT_STORE` | Phase 6 |
| `USE_MEMORY_LAYER` | Phase 7 |
| `USE_PARALLEL_DEV_GRAPH` | Phase 8 |
| `USE_VERIFY_INTEGRATION` | Phase 9 |
| `USE_COURIER` | Phase 10 |
| `USE_COST_TRACKER` | Phase 11 |

## API

```js
import { CONFIG_ENTRIES, FEATURE_FLAGS, getConfigEntry, listConfigsForRole, canRoleEdit } from "./admin-substrate/registry.js";
import { roleMeets, requireRole } from "./admin-substrate/roles.js";
import { snapshotAllFlags, readFlag } from "./admin-substrate/feature-flags.js";
import { readConfig, writeConfig, snapshotConfig } from "./admin-substrate/config-store.js";
import { appendAudit, readAudit } from "./admin-substrate/audit.js";

// Role check
roleMeets("super_admin", "admin");                 // true
requireRole(actorRole, "super_admin", "edit cost thresholds");   // throws if denied

// List configs visible to a role
listConfigsForRole("operator");                    // returns visible entries

// Read/write a config
const { entry, value } = await readConfig("courier_routing");
await writeConfig("courier_routing", updatedValue);   // atomic temp+rename, schema_version checked

// Snapshot for diff/UI
await snapshotConfig("courier_routing");           // {id, path, bytes, sha256, updated_at}

// Feature flags
snapshotAllFlags();                                // [{flag, current: "on"|"off"|null, effective: "on"|"off"}]
readFlag("USE_MCP_TOOLS");                         // "on" | "off" | null

// Audit
await appendAudit({ actor: "alice", action: "config.update", target: "courier_routing", meta: {sha: "abc"} });
await readAudit({ actor: "alice", limit: 50 });    // most-recent-first
```

## Role hierarchy (B7 §2.1)

```
super_admin (rank 3)   →   full access, all sensitive configs
    ▲
admin       (rank 2)   →   edit non-sensitive configs (routing, registry)
    ▲
operator    (rank 1)   →   view all configs, no edits
    ▲
viewer      (rank 0)   →   no config access (default for unknown actors)
```

`roleMeets(actor, required)` is `actor_rank ≥ required_rank`. Unknown roles return false (deny by default).

## Atomic write contract

Writes go to a temp sibling file (`<config>.json.tmp.<random>`) then rename in place. POSIX rename is atomic on the same filesystem — readers always see either the old or the new bytes, never a partial file.

`schema_version` validation: if a registry entry declares `schema_version: 1`, writes must include `schema_version: 1` in the payload. Mismatch → reject. Prevents accidental cross-version writes from older admin clients.

## Audit log layout

Lives at `_admin-audit.jsonl` in repo root by default; override via `ADMIN_AUDIT_LOG` env. Append-only JSONL:

```jsonl
{"at":"2026-04-23T10:15:00Z","actor":"alice","action":"config.update","target":"cost_thresholds","meta":{"sha":"abc123"}}
{"at":"2026-04-23T10:16:42Z","actor":"bob","action":"role.deny","target":"courier_routing","denied":true}
```

Read with `readAudit({actor, action, target, limit})` — most-recent-first, all filters AND-combined.

## Feature flags

`snapshotAllFlags()` returns all 8 known flags with `current` (raw env value transformed to on/off/null) and `effective` (current OR `default_when_unset`). 12-A is **read-only** for flags; 12-B will add a runtime toggle endpoint that updates an in-memory layer + restarts processes that need to re-read env.

## Smoke test

```
$ node admin-substrate/smoke-test.js
[registry]            ✓ 6 assertions
[roles]               ✓ 9 assertions
[role × config gates] ✓ 6 assertions
[feature flags]       ✓ 8 assertions
[config round-trip]   ✓ 8 assertions (atomic write tested via temp path; real configs untouched)
[audit log]           ✓ 7 assertions

[smoke] OK  — 39 assertions across 6 test groups
```

## Design decisions

- **Library, not server** (D125): HTTP routing in 12-B. Same scaffolding discipline as Phases 5-A through 11-A.
- **Code catalog, not auto-discovery** (D126): adding/removing a config requires editing `registry.js`. Explicit beats implicit.
- **Atomic write via temp+rename** (D127): never leave a config half-written; readers always see consistent state.
- **Integer rank for roles** (D128): O(1) comparison; B7 spec's 3-level hierarchy fits cleanly.
- **JSONL audit log** (D129): same shape as Phase 6-A artifact index, Phase 7-A memory index. One pattern across all "append-only audit-ish" data.
- **Read-only flags in 12-A** (D130): runtime toggling needs a process-restart strategy; defer to 12-B.

## Rollback

12-A has no runtime hooks. The library exists but nothing calls it. Removal = deleting the directory.

## What 12-B adds

- HTTP routes in `server/admin-config.mjs` (likely fold into `server/admin-keys.mjs`)
- React Admin pages in `factory-dashboard/src/pages/Admin/` for browse/edit
- Postgres `config_settings` migration from JSON files (with backward-read of JSONs as fallback)
- Runtime feature-flag toggle endpoint with process-restart signaling
- Diff-view for config changes before save
- Bulk export/import of all configs (for backups + cross-VM migrations)
