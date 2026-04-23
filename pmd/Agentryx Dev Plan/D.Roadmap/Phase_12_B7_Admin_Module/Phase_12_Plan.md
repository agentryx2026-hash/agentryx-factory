# Phase 12 — B7 Admin Module v1

**One-liner**: Implement the existing PMD `B7 Admin & Operations Module` standard — Super Admin / Admin / Operator role hierarchy, runtime config CRUD, feature flag toggles, masked sensitive values, audit log.

See `pmd/Agentryx Dev Plan/B.Agentryx Edge/B7_Admin_Operations_Module.md` for the full spec.

## Context (pre-phase code survey)

Per Phase 4 Lesson #1 ("read existing code before scoping"):

- **Phase 2.5 already shipped a partial Admin Module**: `server/admin-keys.mjs` (HTTP API on port 4402) + `llm-router/src/keys.js` (AES-256-GCM encrypted key store + audit log + `X-Remote-User` actor capture). Provider key CRUD + cost summary endpoints already work.
- **Many JSON config files exist** awaiting admin CRUD:
  - `configs/pmd-registry.json` — 25 PMD doc metadata (Phase 4)
  - `configs/cost-thresholds.json` — cost warn/cap thresholds (Phase 11-A)
  - `configs/courier-routing.json` — event → channel routing (Phase 10-A)
  - `configs/llm-routing.json` — task tier → provider/model routing (Phase 2)
  - `configs/llm-prices.json` — provider pricing table
  - `configs/providers.json` — provider catalog
  - `cognitive-engine/mcp/configs/servers.json` — MCP server catalog (Phase 5-A)
- **8 feature flags shipped across Phases 4-11**: `PRE_DEV_USE_GRAPH`, `USE_MCP_TOOLS`, `USE_ARTIFACT_STORE`, `USE_MEMORY_LAYER`, `USE_PARALLEL_DEV_GRAPH`, `USE_VERIFY_INTEGRATION`, `USE_COST_TRACKER`, `USE_COURIER`. All currently env-only — no runtime toggle.

**Decision**: Phase 12-A builds the substrate library (registry + role check + config CRUD primitives + feature flag enumerator). Phase 12-B wires it into HTTP routes (extends admin-keys.mjs or new admin-config.mjs) and ships the React UI.

## Design

```
cognitive-engine/admin-substrate/
  ├── types.js              — Role enum, ConfigEntry, FeatureFlag, AuditEntry shapes
  ├── registry.js           — catalog of all known config files + feature flags
  ├── config-store.js       — read/write/validate JSON config files (atomic writes, schema_version checks)
  ├── feature-flags.js      — enumerate flags, check current values, validate names
  ├── roles.js              — role gating (super_admin > admin > operator > viewer)
  ├── audit.js              — append-only audit log of admin actions
  ├── smoke-test.js         — end-to-end CRUD + role + flag tests
  └── README.md
```

Phase 12-B will add:
- HTTP routes in `server/admin-config.mjs` (likely fold into `server/admin-keys.mjs`)
- React `Admin` panel in `factory-dashboard/src/pages/Admin/`
- Postgres backend for `config_settings` table (migrate from JSON files)

## Scope for this phase (12-A: substrate library)

Mirrors 5-A through 11-A pattern.

| Sub | What | Deliverable |
|---|---|---|
| 12-A.1 | `admin-substrate/types.js` — Role hierarchy, ConfigEntry, FeatureFlag, AuditEntry | ✅ |
| 12-A.2 | `admin-substrate/registry.js` — catalog of all known configs + flags + their schemas | ✅ |
| 12-A.3 | `admin-substrate/config-store.js` — atomic JSON read/write + schema_version validation | ✅ |
| 12-A.4 | `admin-substrate/feature-flags.js` — enumerate + read current process.env values | ✅ |
| 12-A.5 | `admin-substrate/roles.js` — role rank check (`canEdit`, `canView`) | ✅ |
| 12-A.6 | `admin-substrate/audit.js` — append-only `_admin-audit.jsonl` log | ✅ |
| 12-A.7 | Smoke test: registry, config CRUD, role gates, flag enum, audit | ✅ |
| 12-A.8 | `admin-substrate/README.md` + flag docs | ✅ |

**Out of scope for 12-A** (deferred to 12-B):

- HTTP routes (extend admin-keys.mjs or new server file)
- React Admin UI in factory-dashboard
- Postgres `config_settings` table migration
- Live runtime toggle of feature flags (requires sigHUP or similar to graph processes)
- Multi-tenant scoping of configs (per-tenant overrides)

## Why this scope is right

- **Substrate-first**: all the JSON configs already exist. The library that knows their shapes + writes them safely is the right v1 — no UI committed before contract is firm.
- **Atomic file writes**: `tmp file → rename` to prevent half-written JSON corrupting routing/cost/courier configs mid-edit.
- **Audit log is critical**: B7 spec mandates audit trail. JSONL append-only matches Phase 6-A artifact + Phase 7-A memory patterns.
- **Reuses Phase 2.5 actor pattern**: `X-Remote-User` from nginx is the source-of-truth for who did what. No new auth invented.
- **Role hierarchy is simple**: 4 levels (super_admin / admin / operator / viewer), compared by integer rank. Matches B7 spec section 2.1.

## Phase close criteria

- ✅ `admin-substrate/` scaffolded
- ✅ Registry catalogs all 7 known JSON configs + 8 feature flags from Phases 4-11
- ✅ Config store does atomic writes + schema_version validation
- ✅ Role gating works at integer-rank comparison level
- ✅ Audit log appends `{actor, action, target, at}` per change
- ✅ Smoke test: registry catalog, config round-trip, role gates, flag enumeration, audit
- ✅ No changes to `admin-keys.mjs`, graph files, `telemetry.mjs`, or any of the 7 config files
- ✅ Phase docs: Plan (expanded), Status, Decisions (D125-Dxx), Lessons

## Decisions expected

- **D125**: Substrate as a library; HTTP routes deferred to 12-B (matches Phase 5-A through 11-A discipline)
- **D126**: Registry as a code catalog (typed entries) rather than a discovered/scanned thing — explicit beats implicit
- **D127**: Atomic writes via temp-file + rename — prevents corrupted JSON
- **D128**: Role hierarchy = integer rank (super_admin=3 > admin=2 > operator=1 > viewer=0)
- **D129**: Audit log is JSONL, lives at `_admin-audit.jsonl` next to repo root (default — overridable)
- **D130**: Feature flags read from process.env only in 12-A; mutation deferred to 12-B (needs process restart strategy)
