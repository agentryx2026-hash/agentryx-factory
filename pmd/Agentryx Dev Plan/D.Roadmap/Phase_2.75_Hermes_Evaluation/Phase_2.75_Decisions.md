# Phase 2.75 — Decisions Log

## D62 — Docker isolation for Hermes install, not native script

**What**: Deploy Hermes via Docker rather than running its `curl | bash` install script on the host.

**Why**:
- Host install modifies `~/.bashrc`, writes to `~/.hermes/`, and installs Python deps — non-trivial footprint to remove if evaluation is unfavorable.
- Docker container is one `docker compose down` away from fully reverted state.
- Isolation matches our existing pattern (n8n, postgres, litellm are all containerized).

**Cost**: Hermes may not have an official image. If not, we build a minimal Dockerfile that runs `scripts/install.sh` inside the container.

**Revisit**: If Docker has noticeable friction (e.g. filesystem sandbox interactions, gateway port bindings), fall back to native install. Document switch.

## D63 — Phase 2.75 inserts between Phase 1.5 and Phase 3, NOT before Phase 1.5

**What**: Despite Phase 1.5 being cosmetic and Phase 2.75 being evaluation-only, run 1.5 first.

**Why**: Phase 1.5 (rename + monorepo migration + tool links + Paperclip UI) touches the live factory services. Running it FIRST means Phase 2.75 benchmarks run against the stabilized, renamed infrastructure. Otherwise we benchmark, then rename, then have to re-verify everything.

**Counter-argument rejected**: "But Hermes eval informs Phase 7/15 design — run eval first to avoid wasted work on Phase 1.5." — Phase 1.5 is not wasted if we adopt Hermes; it still happens and is valuable regardless.

## D64 — Rename our Phase 10 agent from "Hermes" to "Courier" before the eval phase starts

**What**: `Phase_10_Hermes_External_Comms/` → `Phase_10_Courier_External_Comms/`. All internal refs updated.

**Why**: Our roadmap had an internal agent named "Hermes" for external comms (Slack/GitHub/email). Nous Research's framework is also named Hermes. The collision would cause constant ambiguity ("which Hermes do you mean?") — and if we adopt Nous's Hermes for the comms role, our "Courier" slot becomes a configuration of Hermes rather than a competing concept.

**Date**: 2026-04-21, before Phase 2.75 start.

## D65 — Evaluation timebox: 2 sessions max

**What**: If Phase 2.75 decision isn't clear after 2 sessions of benchmarking, produce a "needs more data" decision and defer to Phase 7 proper (where memory layer evaluation happens anyway).

**Why**: Hermes has 40+ tools and many features. Could rabbit-hole for weeks. Better to make a provisional decision, proceed with other phases, revisit if findings in Phase 3-5 change the calculus.

## D66 — Run benchmarks with OUR OpenRouter key, not separate Hermes billing

**What**: Hermes will be configured to use our existing OpenRouter API key — NOT a separate Nous Portal or direct-provider account.

**Why**:
- Consistent cost accounting: costs go to the same `llm_calls` table (via Hermes's internal logs cross-referenced to OpenRouter billing).
- Same model tier for both runtimes = fair comparison.
- Reduces key management surface — the factory stays source-of-truth for model credentials.

**Caveat**: If Hermes has native features that require Nous Portal (e.g. Honcho is hosted), we enable those separately and document cost.

---

## Decisions made during Phase 2.75-A (install)

### D67 — Use official `nousresearch/hermes-agent:latest` image, not build from source

**What**: `docker pull nousresearch/hermes-agent:latest` — use the published image directly rather than running the install script in a custom Dockerfile.

**Why**:
- Image is official (Docker Hub, NousResearch namespace). Signed by upstream.
- Saves build time + avoids maintaining our own Dockerfile that drifts from upstream.
- Matches upstream's supported deployment pattern.
- Existing image has `PYTHONUNBUFFERED`, `PLAYWRIGHT_BROWSERS_PATH`, `HERMES_WEB_DIST`, `HERMES_HOME` pre-configured — zero surprise.

**Tradeoff**: If upstream publishes a broken image, we inherit. Mitigation: the 2-session timebox + committed `image:` tag in compose gives us pin-ability later (change `:latest` to a specific digest if a release breaks).

### D68 — Container user UID 10000 (Hermes default), host `data/` chown'd to match

**What**: `./data` on host chown'd to UID 10000. Kept `HERMES_UID=1001` env in compose in case upstream ever respects it (currently doesn't seem to).

**Why**: Hermes's Dockerfile creates a non-root user at UID 10000. Path of least resistance is `chown` the bind-mounted dir to match. Files in `./data` are gitignored anyway — the UID mismatch only matters operationally, not for git.

**Alternative rejected**: switch to a named Docker volume (container-managed, ignores host UID). Bind-mount is more explicit for teardown.

### D69 — Hermes's programmatic interface is `batch_runner.py`, not an HTTP API

**What**: For Phase 2.75 benchmark comparison, we'll call `batch_runner.py` with a JSONL dataset of prompts. Invocation:

```bash
docker exec factory-hermes /opt/hermes/.venv/bin/python3 /opt/hermes/batch_runner.py \
  --dataset_file /opt/data/benchmarks.jsonl \
  --model openrouter/anthropic/claude-haiku-4-5 \
  --run_name phase-2.75-bench-haiku
```

**Why**:
- Hermes is primarily designed as an interactive agent (TUI, Slack, Discord gateways). No first-class HTTP API.
- `batch_runner.py` is the officially-supported way to run prompts programmatically — output is structured JSONL of results.
- Avoids scraping the TUI or shimming a fake HTTP server around `hermes chat`.

**Implication for ADOPTING Hermes**: if we move Hermes into production factory use, the integration is via `docker exec ... python3 batch_runner.py`, not HTTP. Paperclip's job dispatcher can spawn containers or exec into a long-running one. Captured as input for the Phase 2.75-D decision matrix.

### D70 — Teardown after 2.75-A discovery; re-start cleanly in 2.75-B

**What**: `docker compose down` after Phase 2.75-A discovery run. `./data/` preserved (bind-mounted, persists on disk even after container removed). Phase 2.75-B restarts from clean state.

**Why**: Discovery-phase container accumulated exploratory state (bundled skills synced, some TUI session logs). Starting benchmark phase from a clean container boundary keeps benchmark results reproducible.

**Reset to deeper baseline**: `sudo rm -rf ./data/ && mkdir data && sudo chown -R 10000:10000 ./data` if we want to nuke skills + memory + everything. For benchmarks, keeping bundled skills is fine — they're upstream-shipped, not accumulated state.
