# Phase 1 — Restore and Observe

**Goal**: Get the existing factory pipeline alive on this migrated VM, fully instrumented, and reproducible on any future VM via a single restore script.

**Started**: 2026-04-20
**Status file**: [Phase_01_Status.md](Phase_01_Status.md)

## Context

VM was migrated. Source code intact (cognitive-engine, pixel-factory-ui, paperclip, openclaw, claw-code-parity, agent-workspace) but runtime config (systemd units, ttyd config, n8n workflow imports) did not migrate. Two URLs broken at start:

- `claw-code.agentryx.dev` — shows system `login:` instead of Claw Code REPL (ttyd config wrong)
- `dev-hub.agentryx.dev` — 502 Bad Gateway (Vite + telemetry + metrics + paperclip not running)

Docker stack (postgres, redis, n8n, langfuse, chromadb) is up. n8n / langfuse / chroma data is empty (this is expected — no real data was on old VM).

## Subphases

### Phase 1A — Fix claw-code

1. Add HTTP basic auth at the **nginx** layer (single-user dev box, stops auth before request reaches ttyd). htpasswd file at `/etc/nginx/.htpasswd-claw-code`.
2. Rewrite `/etc/default/ttyd`:
   ```
   TTYD_OPTIONS="-i lo -p 7681 -W bash -lc /home/subhash.thakur.india/Projects/claw-code-parity/claw-web-launcher.sh"
   ```
3. Patch `/usr/lib/systemd/system/ttyd.service`: add `User=subhash.thakur.india` + `Group=subhash.thakur.india`. ttyd should not run as root.
4. Ensure `ANTHROPIC_API_KEY` is in `claw-code-parity/.env` (chmod 600).
5. `systemctl daemon-reload && systemctl restart ttyd`.
6. Test: `curl -u user:pass https://claw-code.agentryx.dev/` should serve ttyd's HTML, not login prompt.

### Phase 1B — Stand up dev-hub services

5 systemd units, each running as `subhash.thakur.india`, with `Restart=on-failure`:

| Unit | Working dir | ExecStart |
|---|---|---|
| `pixel-factory-ui.service` | `~/Projects/pixel-factory-ui/` | `npm run dev -- --host 127.0.0.1 --port 5173` |
| `pixel-factory-metrics.service` | `~/Projects/pixel-factory-ui/` | `node server/metrics.mjs` |
| `pixel-factory-telemetry.service` | `~/Projects/pixel-factory-ui/` | `node server/telemetry.mjs` |
| `paperclip.service` | `~/Projects/paperclip/` | `pnpm dev` |
| `openclaw-gateway.service` | `~/Projects/openclaw/` | *(exact command TBD — research during execution)* |
| `cognitive-engine.service` | `~/Projects/cognitive-engine/` | `node trigger.js` (or equivalent) |

`EnvironmentFile=` per service so each picks up the right `.env`.

### Phase 1C — Verify and smoke test

1. `curl -I https://dev-hub.agentryx.dev/` → 200 OK with Vite UI.
2. `curl -I https://dev-hub.agentryx.dev/n8n/` → 200 OK.
3. n8n workflow re-import: load `~/Projects/n8n-github-to-paperclip.json` via n8n web UI.
4. Submit a one-line tiny test request through the cognitive-engine. Confirm at least 3 agent nodes execute and emit telemetry.
5. Check `cognitive-engine/stderr.log` is clean (no 429s, no missing-key errors).
6. Open the dashboard at https://dev-hub.agentryx.dev/ and confirm telemetry stream is live.

### Phase 1D — Repo the runtime config

1. Move `/etc/default/ttyd`, all systemd units, nginx vhosts into `agentryx-factory/deploy/` (versioned).
2. Replace originals with symlinks (`ln -s deploy/systemd/ttyd.service /etc/systemd/system/ttyd.service`).
3. Write `deploy/restore.sh`:
   - Symlinks all configs from repo into `/etc/`
   - `daemon-reload`, enables, starts all units
   - Idempotent (safe to re-run)
4. Test by running `restore.sh` on a scratch VM (or at minimum, dry-run it locally).

### Phase 1E — Snapshot and close

1. Take a GCP disk snapshot of this VM. Free insurance.
2. Update `Phase_01_Status.md` to "complete".
3. Write `Phase_01_Lessons.md` with: what surprised us, what to do differently in Phase 2.
4. Close the Phase 1 milestone on GitHub.

## Exit criteria

- Both URLs respond correctly without manual intervention (claw-code shows REPL; dev-hub shows live dashboard).
- Smoke test passes — request → 3+ agents execute → telemetry visible.
- `deploy/restore.sh` works idempotently.
- VM disk snapshot captured.
- Phase 1 milestone closed; Phase 2 can begin.

## Dependencies / blockers

- **User input — Anthropic API key** for `claw-code-parity/.env`
- **User input — basic auth username + password** for nginx claw-code vhost
- **User input — Verify portal real URL** (only blocks `Modules/Verify_Portal_Integration.md` doc, not Phase 1 execution)
- **Research during execution — exact OpenClaw daemon start command**
