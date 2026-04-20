# Phase 2 — LLM Router and Cost Telemetry

**Goal**: Eliminate single-LLM-provider fragility (the Gemini 429 incident that killed Phase 0). Per-task model assignment. Per-call cost capture. Switchable routing backends per the configurability principle.

**Status**: sketched (executes after Phase 1 closes)

## Why this is Phase 2 (not Phase 3)

Phase 0 ended on a Gemini rate-limit error that took down the whole pipeline. Building anything on top (intake agent, PMD generation, etc.) on a single-provider foundation just rebuilds the same fragility. Phase 2 is the load-bearing fix.

## Architecture

### Router (configurable backend)

Per Principle 1, support **both** routing backends, switchable from admin UI:

| Backend | Pros | Cons |
|---|---|---|
| **LiteLLM** (self-hosted, in `factory-dashboard/server/router/`) | Data residency, no third-party fees, full control | One more thing to operate |
| **OpenRouter** (hosted) | Zero ops, broadest model catalog, free tier | Third-party dependency, per-token markup |

Both exposed behind a single in-house facade: `factory-dashboard/server/llm.mjs`. Agents call `llm.complete({task: 'architect', messages: [...]})` and the facade picks router based on admin config.

### Per-task model assignment

YAML config at `configs/llm-routing.yaml` (template — admin UI overrides at runtime):

```yaml
defaults:
  router: litellm   # or openrouter
  fallback_chain: [primary, fallback_1, fallback_2]

tasks:
  triage:
    primary: gemini-2.5-flash
    fallback_1: claude-haiku-4-5
    fallback_2: qwen-3-7b

  architect:
    primary: claude-opus-4-7
    fallback_1: gpt-5
    fallback_2: gemini-2.5-pro

  code:
    primary: claude-sonnet-4-6
    fallback_1: gpt-5-mini
    fallback_2: gemini-2.5-flash

  cheap:
    primary: claude-haiku-4-5
    fallback_1: gemini-2.5-flash-lite
    fallback_2: deepseek-chat
```

Router catches 429 / 5xx and walks the fallback chain automatically. Logs which model actually served the request.

### Cost capture

Every LLM call records to Postgres `llm_calls` table:
- `project_id`, `phase`, `agent`, `task_type`
- `router_used`, `model_attempted` (array, in fallback order), `model_succeeded`
- `input_tokens`, `output_tokens`, `cost_usd_estimated`
- `latency_ms`, `ts`
- `request_id` (for trace lookup in Langfuse)

Cost computed from a per-model price table in `configs/llm-prices.yaml` (manually maintained until Phase 11 cost dashboard auto-pulls from provider APIs).

### Hard caps

`MAX_PROJECT_BUDGET_USD` and `MAX_DAILY_BUDGET_USD` env vars. Router refuses calls that would exceed; emits a `budget_exceeded` event for Hermes (Phase 10) to alert.

## Subphases

### Phase 2A — Router facade

1. Create `factory-dashboard/server/llm.mjs` — single entry point for all LLM calls.
2. Implement `litellm` backend (self-host LiteLLM in a docker container; add to `docker-compose.yml`).
3. Implement `openrouter` backend (HTTP client, no separate container).
4. Backend selection from env var `LLM_ROUTER_BACKEND={litellm|openrouter}`.
5. Health check endpoint per backend.

### Phase 2B — Refactor cognitive-engine

1. Replace direct `ChatGoogleGenerativeAI` instantiations in `factory_graph.js`, `dev_graph.js`, etc., with calls to the facade.
2. Each agent node declares its `task_type` ('architect', 'code', 'cheap', etc.).
3. Smoke test: same agent graph, but kill Gemini key — verify fallback to Claude / Qwen.

### Phase 2C — Cost capture

1. Add `llm_calls` Postgres table (Prisma / direct SQL — TBD).
2. Insert one row per LLM call.
3. Basic cost view in dashboard: project × agent × spend × tokens.

### Phase 2D — Hard caps

1. Pre-call budget check in facade.
2. Emit `budget_exceeded` event (initially logged; Hermes wires to Slack in Phase 10).

### Phase 2E — Compare mode (configurability win)

1. Admin UI: "Run task on N models, show outputs side-by-side."
2. Useful for evaluating which model/router serves which task best.
3. Feeds Phase 1.0 architectural decisions.

## Exit criteria

- Same Phase 1 smoke test passes, but graph survives a forced Gemini 429 by failing over.
- Cost panel shows real dollar spend for the test run.
- Both `litellm` and `openrouter` backends pass health check.
- A `compare` request returns N parallel outputs from N models.

## Dependencies

- Provider API keys (admin will need: Anthropic, Google, OpenAI, OpenRouter, optionally DeepSeek). Phase 12 (B7 admin module) builds the UI to manage these — until then, env vars.
- Decision needed before start: which provider keys does the admin actually have / want to use?
