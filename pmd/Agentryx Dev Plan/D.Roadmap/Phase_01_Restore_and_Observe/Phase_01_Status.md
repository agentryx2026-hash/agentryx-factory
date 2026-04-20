# Phase 1 — Status

**Phase started**: 2026-04-20
**Last updated**: 2026-04-20 (Phase 1A + 1B complete)

## Done

### Diagnostic
- ✅ Diagnosed root causes:
  - claw-code: ttyd serving system `login` instead of launcher script
  - dev-hub: 4 Node services not running
- ✅ Verified all source code intact (220 MB agent-workspace + git history)
- ✅ Confirmed 10-agent pipeline definitions intact ([factory_graph.js](../../../../../cognitive-engine/factory_graph.js))
- ✅ Confirmed credentials/tokens intact in `~/.openclaw/`, `paperclip/.env`
- ✅ Last cognitive-engine run died on Gemini 429 — wiring confirmed working end-to-end before

### Phase 0 — GitHub setup
- ✅ Fresh `agentryx-factory` repo on `agentryx2026-hash` account
- ✅ Full PMD structure with 20-phase roadmap committed
- ✅ Labels (16), milestones (4), branch protection via ruleset
- ✅ 3 foundational issues filed
- ✅ Memory files saved (project pointer, configurability rule, user profile)

### Phase 1A — claw-code fix
- ✅ htpasswd (bcrypt) at `/etc/nginx/.htpasswd-claw-code`
- ✅ nginx `auth_basic` added to `claw-code.agentryx.dev` vhost
- ✅ `/etc/default/ttyd` updated to launch `claw-web-launcher.sh`
- ✅ ttyd drop-in override at `/etc/systemd/system/ttyd.service.d/override.conf` runs ttyd as `subhash.thakur.india` (no longer root)
- ✅ Verified: 401 without auth, 200 with auth, process running as user, `.env` key accessible

### Phase 1B — dev-hub services
- ✅ 4 systemd units written, enabled, running:

| Unit | Port | Status |
|---|---|---|
| `factory-dashboard.service` | 5173 | active, 0 restarts |
| `factory-metrics.service` | 4400 | active, 0 restarts |
| `factory-telemetry.service` | 4401 | active, 0 restarts |
| `factory-paperclip.service` | 3101 (env `PORT` overridden from 3100) | active, 0 restarts |

- ✅ Public URLs: 200 OK (dashboard root, `/api/health`, `/api/metrics`, `/telemetry/telemetry/stream` SSE, `/n8n/`)
- ✅ Vite serves the real "Agentryx Dev-Hub" UI (not placeholder)

### Notes discovered during execution
- cognitive-engine is **not** a long-running service — `telemetry.mjs` spawns `dev_graph.js` / `post_dev_graph.js` as child processes on demand. No systemd unit needed.
- OpenClaw gateway: not required for the factory to come up. Paperclip can reach it lazily. Defer starting as own unit until a test request needs it.
- Paperclip's default port changed upstream from 3101 to 3100; we overrode via `.env` to match existing nginx. See Decision D9 (to be added).

## Pending (to close Phase 1)

- ⏳ **Phase 1C**: n8n workflow re-import (`~/Projects/n8n-github-to-paperclip.json` → n8n UI at https://dev-hub.agentryx.dev/n8n/) — requires browser
- ⏳ **Phase 1C**: End-to-end agent smoke test — submit request through telemetry API, confirm cognitive-engine spawns and agents emit telemetry
- ⏳ **Phase 1D**: Copy runtime configs into `deploy/` (systemd units, nginx vhosts, ttyd config, htpasswd), write `restore.sh`, symlink from `/etc/`
- ⏳ **Phase 1E**: GCP disk snapshot, close Phase 1 milestone, write `Phase_01_Lessons.md`

## Session-end security TODO (user)

Secrets were exposed in chat during this session. **Must rotate before session ends**:

- ❗ Classic GitHub PAT `ghp_CWTDk...` (revoked earlier — confirm)
- ❗ Fine-grained PAT — partially leaked in `gh auth status` output
- ❗ Anthropic API key — pasted directly in chat (key on disk is new, but old one still valid until revoked at https://console.anthropic.com/settings/keys)
- ❗ Basic auth password `Ulan@2026` — bcrypt'd on disk but plaintext in transcript
