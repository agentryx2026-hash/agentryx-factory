# Phase 1 — Status

**Phase started**: 2026-04-20
**Last updated**: 2026-04-20

## Done

- ✅ Diagnosed root causes:
  - claw-code: ttyd serving system `login` instead of launcher script
  - dev-hub: 4 Node services not running (Vite 5173, metrics 4400, telemetry 4401, paperclip 3101); 5th process (cognitive-engine LangGraph) also down
- ✅ Verified all source code intact (220 MB agent-workspace + git history for all repos)
- ✅ Confirmed agent pipeline definitions intact: 10 agents in [factory_graph.js](../../../../../cognitive-engine/factory_graph.js) — Picard → Sisko → Troi → Jane → Spock → Torres ⇄ Tuvok ⇄ Data → Crusher → O'Brien
- ✅ Confirmed credentials/tokens intact in `~/.openclaw/`, `paperclip/.env`
- ✅ Last cognitive-engine run died on Gemini 429 (rate limit, not crash) — confirms wiring worked end-to-end before
- ✅ Phase 0 (GitHub setup) — fresh `agentryx-factory` repo, `gh` auth, this PMD structure, baseline commit

## Blocked on (user input)

- ❌ **Anthropic API key** for `~/Projects/claw-code-parity/.env`
- ❌ **Basic auth credentials** (username + password) for nginx `claw-code.agentryx.dev` vhost
- ❌ **Verify portal real URL** (blocks `Modules/Verify_Portal_Integration.md` only — not Phase 1 execution itself)

## Next (when unblocked)

1. Phase 1A — claw-code fix (15 min once inputs received)
2. Phase 1B — 6 systemd units (30 min)
3. Phase 1C — smoke test + n8n workflow import (15 min)
4. Phase 1D — repo runtime config + restore.sh (30 min)
5. Phase 1E — snapshot + close (10 min)

Total estimated: ~100 min of execution once unblocked.

## Open questions to resolve during execution

- Exact start command for OpenClaw daemon (need to read its README / package.json scripts)
- Does `cognitive-engine/trigger.js` start the LangGraph runner, or is there a different entry point?
- Should the cognitive-engine systemd unit auto-restart on Gemini 429, or sleep + retry? (Probably sleep + retry; will fail-loop otherwise.)
