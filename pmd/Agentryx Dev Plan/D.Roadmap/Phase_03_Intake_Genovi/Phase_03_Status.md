# Phase 3 — Status: COMPLETE (scope-narrowed) ✅

**Phase started**: 2026-04-21
**Phase closed**:  2026-04-21
**Duration**: single session

## Subphase progress

| Sub | What | Status |
|---|---|---|
| 3-A | `intake` task tier in `llm-routing.json` | ✅ done |
| 3-B | `requirements.schema.json` defined | ✅ done |
| 3-C | `genoviNode` in `pre_dev_graph.js` + edge | ⏳ **moved to Phase 4** |
| 3-D | A0 markdown renderer | ✅ done (in `genovi.js`) |
| 3-E | Rewire `/api/factory/pre-dev` to spawn pre_dev_graph.js | ⏳ **moved to Phase 4** |
| 3-F | Smoke test with real SRS | ✅ done |
| 3-G | Close + Lessons | ✅ done |

## Scope narrowing — rationale

Original Phase 3 plan included wiring Genovi into `pre_dev_graph.js` (adding a node, updating edges) AND rewiring the live `/api/factory/pre-dev` endpoint to spawn the graph instead of doing template substitution. Both are risky changes to production-running code paths.

We scope-narrowed to **Genovi-as-standalone-library** for Phase 3. The integration moves to **Phase 4 (PMD Template Registry)** — which is the natural home for "make all pre-dev docs real LLM output, not template substitution." Phase 4 will wire Genovi (A0) + agent-nodes for A1/A2/A3/.../B9 into a single graph.

Why this is the right call:
- Isolated Genovi = independently testable (done, works)
- Phase 4 already scoped to tackle the full doc-generation registry
- Avoids two touches of `/api/factory/pre-dev` in consecutive phases

## What shipped

### Code
- `cognitive-engine/schemas/requirements.schema.json` — JSON Schema for structured extraction (14 fields, MoSCoW priorities, domain enum)
- `cognitive-engine/genovi.js` — main module: `runGenovi({ rawScopeText, projectId, projectDir })` → `{ extracted, markdown, usedModel, cost_usd, latency_ms }`. Also exports `parseAndValidate`, `renderA0Markdown`, `buildExtractionPrompt` for testing.
- `configs/llm-routing.json` — new `intake` task tier: `openrouter:google/gemini-2.5-flash` primary (Flash because credit is tight), fallbacks to Haiku → Gemini Pro → Sonnet, `max_tokens: 2000` per-task

### Router enhancements (Phase 2E-follow-up)
Added `max_tokens` as a per-call and per-task parameter:
- `llm-router/src/router.js` — `complete()` accepts `maxTokens` option with priority: call > task config > global 4096
- `llm-router/src/backends.js` — all 5 backends pass through `maxTokens` to provider body
- `llm-router/src/langchain-adapter.js` — `RouterChatModel` constructor accepts `maxTokens`

This unblocks Genovi (Flash needs 2000, couldn't afford 4096) AND makes the router flexible for future tasks with different output-length needs.

## Smoke test result

Input: compact TodoFlow SRS (~120 words, 4 goals, constraints, open items).

Output:
- ✅ model: `openrouter:google/gemini-2.5-flash`
- ✅ cost: $0.000740
- ✅ latency: 5480ms
- ✅ domain: `saas-b2b` (valid enum)
- ✅ complexity: `medium` (valid enum)
- ✅ primary_actors: `["team member", "team lead"]` (strings, correct)
- ✅ 7 functional requirements extracted (FR-001...FR-007 with MoSCoW priorities)
- ✅ 1 open_question surfaced (Google auth vs local — from the source doc's "Open" section)
- ✅ Cost row in `llm_calls` tagged `agent='genovi' task_type='intake'`

Validation caught 1 iteration where LLM used `requirement_id` instead of `id` — fixed by including a worked JSON example in the prompt (cheap, reliable technique).

## Blocker that was resolved mid-phase

OpenRouter account balance is low (402 on 4096-token requests for Pro/Sonnet/GPT-5). Fixed in TWO ways:
1. Downgraded intake primary from Gemini 2.5 Pro → Gemini 2.5 Flash (much cheaper per request)
2. Added per-task `max_tokens: 2000` override (extraction JSON fits comfortably in 2000 tokens)

Note for later: when you top up OpenRouter credit, promote `gemini-2.5-pro` back to intake primary for larger scope docs. Flash is great for structure but Pro is better for dense/long inputs.

## Budget used

| | |
|---|---|
| Total spend this phase | ~$0.003 (smoke test + 2 retry iterations) |
| Model successful | `openrouter:google/gemini-2.5-flash` |
| Models attempted via chain | Pro (402), Sonnet (402), GPT-5 (402) — all failed on credit before I rebalanced the chain |
