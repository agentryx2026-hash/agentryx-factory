# Phase 1 — Decisions Log

Decisions made during this phase. Each entry: **what / why / alternatives rejected**.

## D1 — Use systemd, not pm2

**What**: All dev-hub services run as systemd units, not under pm2 process manager.

**Why**: Already on the box; no extra runtime; survives reboot without `pm2 startup` ceremony; logs via `journalctl`; simple `systemctl restart`. pm2 buys nothing here for our scale.

**Rejected**: pm2 (extra dependency, dashboard not needed at this stage).

## D2 — HTTP Basic Auth for claw-code at nginx layer, not ttyd

**What**: Auth is enforced by nginx (`auth_basic`) before requests reach ttyd. Single htpasswd file.

**Why**: Stops unauthenticated requests at the edge; ttyd config stays simple; credentials managed in one place.

**Rejected**:
- ttyd's own `-c user:pass` (couples auth to process restart)
- OAuth proxy (overkill for one user)

## D3 — Run ttyd as `subhash.thakur.india`, not root

**What**: Drop-in override at `/etc/systemd/system/ttyd.service.d/override.conf` sets `User=` and `Group=`.

**Why**: Internet-exposed shell as root is unacceptable security posture even for a dev box.

**How**: Drop-in file rather than editing `/usr/lib/systemd/system/ttyd.service` — so distro upgrades of ttyd don't clobber our override.

## D4 — Use existing Verify portal repo, integrate not rebuild

**What**: The Verify portal is a separate application (`verify-stg.agentryx.dev`). The factory will integrate via webhooks/API. No rebuild.

**Why**: Already in use in production for one project (HireStream). Generification + integration is cheaper than rewriting.

## D5 — Fresh GitHub repo, archive the old (mono-repo strategy)

**What**: New `agentryx2026-hash/agentryx-factory` repo, dedicated account. Old `microaistudio/Agentryx-Dev-Factory` superseded.

**Why**: Old repos were "save-as-I-go" snapshots, fragmented. Clean structure aligned to the roadmap from commit #1.

**Rejected**:
- Use existing `Agentryx-Dev-Factory` repo (inherits messy fragmented history)
- Multi-repo split (more `.gitignore` and CI surface, no benefit)

## D6 — Mono-repo ≠ subsume forks

**What**: `claw-code-parity`, `paperclip`, `openclaw` stay as their own forked repos. Only factory-original code lives in the mono-repo.

**Why**: Forks need upstream sync. Putting them in the mono-repo breaks that workflow.

## D7 — PMD lives at `agentryx-factory/pmd/`; `~/Projects/PMD` becomes a symlink

**What**: Physical move of PMD into the new repo. Backward-compat symlink at the old path.

**Why**: Single source of truth (the repo). Symlink prevents breakage of any references to old path.

## D8 — Phase 1.5 splits rename + monorepo migration off from Phase 1

**What**: Renaming `pixel-factory-ui` → `factory-dashboard` and physically moving working dirs into the mono-repo is its own Phase 1.5, after Phase 1 restore lands.

**Why**: docker-compose volume names are derived from project directory name. Renaming the dir would orphan existing data volumes. Needs careful handling.

## D9 — Pin Paperclip to PORT=3101 via `.env` override

**What**: Set `PORT=3101` in `~/Projects/paperclip/.env` (was 3100 upstream default).

**Why**: Existing nginx vhost `dev-hub.agentryx.dev` proxies `/paperclip/` to `127.0.0.1:3101`. Easier to override paperclip's `.env` than modify the Certbot-managed nginx config (which could be overwritten on cert renewal).

**Rejected**: Changing nginx `proxy_pass` to 3100 (safer to keep certbot-touched nginx unchanged beyond auth_basic).

## D10 — cognitive-engine does not get its own systemd unit

**What**: No `factory-cognitive-engine.service`. The telemetry service spawns `dev_graph.js` / `post_dev_graph.js` as child processes on demand.

**Why**: That's how the code is actually written (`telemetry.mjs` uses `child_process.spawn` for graph execution, one fresh process per task). Adding a long-running cognitive-engine unit would duplicate and conflict.

**Corollary**: The Gemini 429 incident from before this session happened inside a spawned child process, not a long-running daemon. Phase 2 (LLM router) still needs to handle this — router-as-library injected into `dev_graph.js`, not router-as-service.

## D11 — Secrets never in chat; hard rule

**What**: Any secret (API key, PAT, password) must be entered via terminal prompt (e.g. `read -s -p`) on the user's terminal, not pasted into chat.

**Why**: This session had 3+ leaks. Transcripts are persistent and potentially visible to support staff. Rotate every leaked secret at session end.

**How**: `.gitignore` in `agentryx-factory` now catches `Anthropic-Key`, `*-Key`, `*-Token`, `*-PAT`, `*-Secret`, `*.token`, `.env`, etc. Assistant will proactively refuse to echo or persist any secret pasted inline after the first warning in future sessions (captured in user memory).
