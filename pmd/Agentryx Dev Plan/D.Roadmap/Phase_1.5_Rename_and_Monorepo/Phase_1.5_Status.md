# Phase 1.5 — Status: COMPLETE ✅

**Phase started**: 2026-04-21
**Phase closed**:  2026-04-21
**Duration**: single session

## Split executed

| Sub | What | Status | Commit |
|---|---|---|---|
| 1.5-A | Sidebar Tools & Portals section | ✅ done | `2ba5ec7` |
| 1.5-A | Paperclip SERVE_UI=true | ✅ done | `2ba5ec7` |
| 1.5-A | nginx `/paperclip/` location restored (lost in earlier sed) | ✅ done | `8b6ae73` |
| 1.5-B | GCP snapshot | ✅ done (user action) | `agentryx-factory-pre-1.5b` 2.98 GB |
| 1.5-B | Pin docker-compose `name: pixel-factory-ui` | ✅ done | `38602e7` |
| 1.5-B | Move cognitive-engine into monorepo | ✅ done | `38602e7` |
| 1.5-B | Move pixel-factory-ui → factory-dashboard in monorepo | ✅ done | `38602e7` |
| 1.5-B | Backward-compat symlinks at old paths | ✅ done | (filesystem, not tracked) |
| 1.5-B | Remove factory-dashboard/.git nested repo | ✅ done | `38602e7` |
| 1.5-B | Remove both snapshot/ dirs | ✅ done | `38602e7` |
| 1.5-B | Update systemd unit WorkingDirectory paths | ✅ done | `38602e7` |
| 1.5-B | Update telemetry.mjs cognitive-engine spawn paths | ✅ done | `38602e7` |
| 1.5-B | GitHub repo rename → agentryx-dev-factory | ✅ done | — |
| 1.5-B | Update local git remote | ✅ done | — |
| 1.5-B | Full smoke test | ✅ done | see below |

## Post-migration smoke test

| Check | Result |
|---|---|
| All 6 factory services active, 0 restarts | ✅ |
| dev-hub.agentryx.dev / | 200 |
| dev-hub.agentryx.dev /api/health | 200 |
| dev-hub.agentryx.dev /api/metrics | 200 |
| dev-hub.agentryx.dev /telemetry/telemetry/stream | 200 (SSE) |
| dev-hub.agentryx.dev /n8n/ | 200 |
| dev-hub.agentryx.dev /paperclip/api/health | 200 (after ~30s warmup) |
| dev-hub.agentryx.dev /admin/api/admin/keys no-auth | 401 (correct) |
| claw-code.agentryx.dev / with auth | 200 |
| Docker volumes preserved (pixel-factory-ui_*) | ✅ all 4 |
| llm_calls table reachable | ✅ router call works |
| provider_keys table reachable | ✅ admin UI list works |
| GitHub old-URL redirect | 301 → new URL |

## Final architecture

```
~/Projects/
├── agentryx-factory/                      ← Git mono-repo (renamed → agentryx-dev-factory on GitHub)
│   ├── pmd/                               Project Management Documents (+ Roadmap/)
│   ├── llm-router/                        @agentryx-factory/llm-router package
│   ├── server/                            factory-admin service (Key Console API + Cost API)
│   ├── cognitive-engine/                  LangGraph factory (was ~/Projects/cognitive-engine/)
│   ├── factory-dashboard/                 Vite + React UI (was ~/Projects/pixel-factory-ui/)
│   ├── deploy/                            systemd units, nginx vhosts, restore.sh, docker-compose.yml
│   ├── configs/                           router config, provider catalog, price table
│   └── docs/                              ops runbooks
├── cognitive-engine/ → agentryx-factory/cognitive-engine/     (symlink for legacy refs)
├── pixel-factory-ui/ → agentryx-factory/factory-dashboard/    (symlink for legacy refs)
├── PMD/              → agentryx-factory/pmd/                  (symlink for legacy refs)
├── paperclip/                             (separate vanductai fork, NOT in monorepo)
├── claw-code-parity/                      (separate instructkr fork, NOT in monorepo)
├── openclaw/                              (separate, superseded by Hermes — Phase 2.75)
└── agent-workspace/                       (agent work product, per-project subdirs)
```

## Rollback plan (if anything regresses post-phase)

1. Stop services: `sudo systemctl stop factory-*`
2. Create new disk from snapshot `agentryx-factory-pre-1.5b` via GCP Console
3. Detach current disk, attach new disk, reboot
4. Rollback complete — back to pre-1.5 state with all services restored

Snapshot is intentionally the checkpoint of last known good pre-migration state.
