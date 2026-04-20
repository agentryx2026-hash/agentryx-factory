# Phase 2 — Status

**Phase started**: 2026-04-20
**Last updated**: 2026-04-20

## Done

### 2A — Router facade package (core files)
- ✅ Package `@agentryx-factory/llm-router` scaffolded at `llm-router/`
- ✅ 4 backends implemented: `openrouter`, `litellm` (HTTP client ready, container in 2D), `direct-anthropic`, `direct-gemini`
- ✅ Unified OpenAI Chat Completions protocol (~50 LOC per backend)
- ✅ `complete({task, messages})` → picks fallback chain from task config → iterates
- ✅ `compare({messages, models})` → parallel N-model comparison for debug/eval
- ✅ `health()` → per-backend ping, graceful when key missing
- ✅ Cost computation from `configs/llm-prices.json` (9 models)
- ✅ Task config at `configs/llm-routing.json` (6 tasks: triage / cheap / worker / code / architect / research)
- ✅ LLM_CALL telemetry rows emitted to stderr (Phase 2C replaces with Postgres)

### Phase docs
- ✅ Phase_02_Plan.md active with full subphase breakdown
- ✅ Phase_02_Decisions.md with D12-D17 (protocol, backends, LangChain, backend priority, price table, fail-open)

### Tested
- ✅ All JS files parse clean
- ✅ Config loader: 6 tasks + 9 prices indexed
- ✅ Health check: returns `{}` gracefully when no keys
- ✅ End-to-end call: architect fallback chain iterated 4 models (OpenRouter × 3, direct-Anthropic × 1), all 4 failures captured cleanly, structured error with `attempts` array
- ✅ Behavior-fix during test: moved from "retryable statuses" to "payload-fatal statuses" so 401/billing-400 correctly fall over to next chain entry

### Bug caught during test
- `retry` logic originally treated 4xx as non-retryable (broke chain on first 401). Now: only 413/414/415/422 (payload shape errors) break the chain. Everything else falls over. Rationale: auth/billing/rate-limit are per-backend; next entry may use a different backend with a valid key.

## Current blocker — provider keys (GitHub issue #4)

Router is fully functional but needs at least ONE working provider key to make a real call. Available options:

- **Anthropic** — key on disk works (confirmed: made round trip). But account has $0 credit. Options: (a) add $10-20 credit for testing; (b) use a different provider while we bring up the router.
- **OpenRouter** — single key gives access to ~100 models including Claude/GPT/Gemini with pay-as-you-go. Recommend this — unblocks all 6 task tiers at once.
- **Gemini (paid)** — different key than the one in `paperclip/.env`? The router has a `direct-gemini` backend ready.
- **OpenAI** — GPT-5 family via direct or OpenRouter.

Minimal viable set to unblock: **OpenRouter key** OR **Anthropic credit top-up**.

## Up next

### 2B — LangChain adapter (in progress pending reviewer decision)

`cognitive-engine/factory_graph.js` and siblings instantiate `ChatGoogleGenerativeAI` directly. 2B builds a `RouterChatModel` class compatible with LangChain's `BaseChatModel` interface so graphs swap `new ChatGoogleGenerativeAI({...})` for `new RouterChatModel({task: 'architect'})` with no other changes.

No user input needed to start 2B. Can proceed in parallel with user providing provider keys.

### 2C — Postgres cost capture

Single migration file + `db.js` module. Replaces the stderr `LLM_CALL` emit with a Postgres INSERT. Fail-open (if DB down, still log to stderr). Also enables Phase 2E budget caps.

### 2D — Config switcher + LiteLLM container

Add LiteLLM service to `deploy/docker-compose.yml`, wire `LLM_ROUTER_BACKEND` env var switch.

### 2E — Budget caps

Pre-call check `SELECT SUM(cost_usd) FROM llm_calls WHERE project_id = ? AND ts > today` against `max_project_budget_usd` / `max_daily_budget_usd` from routing config defaults.

### 2F — Compare mode UI

CLI: `npm run compare -- --task=architect --models=opus,gpt-5,gemini-pro --prompt="..."`. Feeds architecture decisions for v1.0.

### 2G — Cost panel

Simple SQL-backed table view in dashboard. Read-only (write path is Phase 12 admin module).
