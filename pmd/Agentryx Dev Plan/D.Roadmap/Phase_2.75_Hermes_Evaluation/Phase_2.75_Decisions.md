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

---

## Phase 2.75-C observations (benchmark attempt)

### D71 — `start-with-live-keys.sh` helper — Hermes uses DB keys, not stale `.env`

**What**: Added `hermes/start-with-live-keys.sh` that calls `keys.js::getKey()` to fetch rotated provider keys from the encrypted admin DB (Phase 2.5), exports them as env vars, then `docker compose up -d`.

**Why**: `.env` files are stale after an admin-UI key rotation (the UI writes only to the encrypted DB). Without this script, Hermes would receive revoked keys and 401 on every call.

**Broader implication**: ANY external tool we integrate (Hermes, future Letta/Graphiti trials, etc.) needs either this "fetch-from-DB" shim OR native integration with our admin DB API. Document pattern.

### D72 — `batch_runner.py` is NOT suitable for simple output comparison

**What**: Phase 2.75 plan assumed `batch_runner.py` would produce clean prompt→output JSONL. It doesn't — it collects RL trajectories (expects multi-turn reasoning + tool calls). Simple one-shot Haiku responses get discarded as "zero reasoning."

**Why this matters**: Hermes is **agent-shaped, not completion-shaped**. Even its "batch" mode expects agentic trajectories. If we want Hermes in PROD as a one-shot completion engine, we'd need to drive `hermes chat` interactively via pexpect/subprocess or use the `gateway` mode with a custom adapter.

**Result**: Phase 2.75-C benchmark with structured metrics is not feasible WITHOUT writing an adapter. The evaluation proceeds based on **architectural characteristics** (interface shape, integration cost, capability surface) rather than benchmark numbers.

### D73 — Hermes has a rich subcommand CLI with 35+ commands

**What**: `hermes --help` reveals subcommands: `chat`, `model`, `gateway`, `setup`, `whatsapp`, `webhook`, `hooks`, `cron`, `memory`, `tools`, `mcp`, `sessions`, `skills`, `plugins`, `dashboard`, `logs`, `claw`, etc.

**Why this matters for our integration**: `hermes gateway` launches a listening server for inbound events. That's our **real integration hook** if we adopt Hermes for any slot — spawn `hermes gateway` as a persistent container, send events to it. NOT `batch_runner.py`, NOT `chat` piped stdin.

**For PROD adoption**: the integration would be:
```
Paperclip (job dispatcher) → HTTP POST to hermes gateway → Hermes processes → result via webhook back to factory
```

---

## Phase 2.75-D — Decision Matrix (the deliverable)

Scope reminder: produces recommendations for **what the PROD factory (v1.0) should use for each slot**. R&D factory (v0.0.1) continues to experiment.

| # | Slot | Current (v0.0.1) | Hermes candidate | **PROD (v1.0) recommendation** | Rationale |
|---|---|---|---|---|---|
| 1 | Pipeline agent runtime (Picard, Spock, ...) | LangGraph JS nodes | Hermes subagents via subprocess/gateway | **Keep LangGraph** | We control prompts, role assignments, cost tiers per agent. Hermes's interactive-first shape adds integration cost (subprocess or webhook shim) for zero capability gain over LangGraph + our router. |
| 2 | Tool plane (Phase 5) | Custom `tools.js` | MCP via Hermes | **Go MCP directly** (skip Hermes as the layer) | Hermes uses MCP under the hood. We can consume MCP servers directly in LangGraph. Adding Hermes as an MCP-wrapper adds latency + no new capability. |
| 3 | Memory layer (Phase 7) | Empty ChromaDB | **FTS5 session search + LLM summarization + Honcho user profiles** | **Adopt Hermes's MEMORY PATTERNS, not the whole framework** | Hermes's memory stack is mature and well-documented. Implement the same pattern (SQLite FTS5 + LLM summary + optional Honcho) in our factory. Possibly hosted alongside (one container as memory service). |
| 4 | Self-improvement (Phase 15) | Undefined | **Tinker-Atropos RL trajectory collection** | **Adopt the pattern when Phase 15 hits** | This is the ONE feature where Hermes has non-trivial novel work (trajectory collection + RL). Too early to evaluate deeply — comes back in Phase 15 planning. |
| 5 | External comms (Phase 10 — Courier) | Custom build planned | **Native Slack/Discord/Telegram/WhatsApp/Signal/Email gateways** | **Use Hermes in gateway mode** | Hermes has 6 messaging integrations in ONE process. Custom-building this is weeks of work. Run `hermes gateway` as a dedicated service, have our factory send events to it. This is the strongest Hermes fit. |
| 6 | Skills marketplace (Phase 18) | Custom build planned | **`agentskills.io` community** | **Use agentskills.io directly** | Existing curated community skill collection. No reason to build our own marketplace when this exists. Our custom skills can coexist. |
| 7 | LLM gateway | Our router (Phase 2) + LiteLLM container | Hermes's inference-provider abstraction | **Keep our router** | Our router has per-task fallback chains, budget caps, DB-backed key management, cost telemetry. Hermes's abstraction is less flexible. |

## D74 — Summary verdict: HYBRID adoption

**PROD (v1.0) factory architecture:**

```
┌─────────────────────────────────────────────────────────────────┐
│  Brain layer                                                    │
│  ───────────                                                    │
│  • cognitive-engine (LangGraph)   ← primary agent runtime      │
│  • Hermes (gateway mode)          ← external-comms agent only   │
└─────────────────────────────────────────────────────────────────┘
                          ▲
                          │
┌─────────────────────────────────────────────────────────────────┐
│  Orchestration layer                                            │
│  ─────────────────                                              │
│  • Paperclip   ← job dispatcher, routes to LangGraph OR Hermes │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  Cross-cutting                                                  │
│  ─────────────                                                  │
│  • Memory: custom SQLite+FTS5+summarization service            │
│    (inspired by Hermes patterns, NOT Hermes itself)             │
│  • Tools: MCP native (Phase 5)                                  │
│  • Skills: agentskills.io community catalog                     │
│  • Self-improvement: Tinker-Atropos pattern (Phase 15)          │
│  • LLM routing: our router (Phase 2) — UNCHANGED                │
└─────────────────────────────────────────────────────────────────┘
```

**Why hybrid > monolithic:**
- Hermes excels at: interactive chat, messaging gateways, skill curation
- LangGraph excels at: deterministic pipelines, per-role prompt engineering, graph topology
- They cover different problem spaces; adopting either wholesale loses the other's strengths
- Configurability principle (D1) is served: both tools available, admin selects per slot

## D75 — Timeboxed decision: SKIP full batch benchmark, accept architectural evaluation

**What**: Phase 2.75-C originally planned to run quantitative benchmarks (cost/latency/quality). We found `batch_runner.py` is unsuitable (RL trajectory focus, discarded our prompts). Instead, the evaluation concluded based on observed architectural characteristics.

**Why this is defensible**: The decision matrix is primarily shape-based, not performance-based. Hermes's performance is not the deciding factor — its INTEGRATION SHAPE is. A 20% faster Hermes response would not change any slot decision above.

**What we'd get from real benchmarks if we invested another session**: numeric confidence on memory retention claims (slot 3). Not worth the session cost at v0.0.1. If Phase 7 memory layer decision ever depends on Hermes's specific memory performance, re-benchmark then with a proper adapter.
