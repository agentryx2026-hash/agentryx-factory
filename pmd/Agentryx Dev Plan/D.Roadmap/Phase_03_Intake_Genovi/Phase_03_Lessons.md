# Phase 3 — Lessons Learned

Phase closed: 2026-04-21. Duration: single session.

## What surprised us

1. **LLMs follow EXAMPLES way better than SCHEMAS.** First pass gave Gemini a JSON schema definition (required fields + property names). It produced JSON with reasonable shape but wrong field names (`requirement_id` not `id`, objects not strings for actors). Second pass gave Gemini a complete worked example — exact field names, enum values, nested structures. First-shot success. **Rule for future structured-output LLM work: show, don't tell.**

2. **OpenRouter credit math is strict and account-specific.** 402 means "you can't afford 4096 tokens at this model's price for THIS account's current balance." Not a general rate limit. Rebalanced by downshifting to cheaper models AND lowering `max_tokens`. The router's fallback chain correctly walked all 3 entries before throwing.

3. **Making `max_tokens` configurable was more important than I realized.** Originally a hardcoded 4096 (from Phase 2 D17.1). But different tasks have very different output-size needs: extraction is 500-2000 tokens, architecture is 2000-8000 tokens, full code generation can be 16K+. Not having per-task max_tokens = overpaying on reserved credit for simple tasks. Now: per-call > per-task-config > global-default, in that priority.

4. **Scope-narrowing mid-phase is a valid move.** Original Phase 3 wanted to wire Genovi into pre_dev_graph.js AND rewire the live /api/factory/pre-dev endpoint. Both are risky single-change items. Pivoted to Genovi-as-library + deferring the integration to Phase 4 (PMD Template Registry) which is its natural home. This is the agile principle working as intended.

5. **Functional requirements are more uniform than I expected.** Every LLM extraction I got back followed "FR-001 [MUST] User can create a task" shape, regardless of source doc style. This suggests Phase 4's downstream agents can rely on FR shape being consistent without defensive parsing.

## What to do differently

1. **Include a worked JSON example in every structured-output prompt from day 1** — don't start with schema-only descriptions and wait for failure.

2. **Add per-task `max_tokens` to `llm-routing.json` as default practice** when defining a new task tier. Set it based on expected output size, not "4096 always."

3. **Keep standalone library + integration as separate phases when they touch different code paths** — Genovi-as-library and Genovi-in-graph are different risk profiles and different test surfaces. Consider this pattern for future new-agent phases.

## What feeds next phases

### Phase 4 — PMD Template Registry
Phase 4 inherits:
- `genovi.js` pattern (module with `run*()` entry point, JSON schema, markdown renderer) as the **template** for all A1-B9 agents
- `requirements.schema.json` as the **canonical data structure** that A1+ agents read from
- Router enhancements (`max_tokens` per-task) — can set different values for architecture / modules / testing tiers
- Integration into `pre_dev_graph.js` + `/api/factory/pre-dev` rewire is part of Phase 4's scope

### Phase 7 — Memory Layer
Genovi's open_questions output feeds directly into memory: "things we don't know about this project yet" is a natural memory primitive. Cross-session: if a previous project asked the same open question, recall the answer.

### Phase 9 — Verification Queue
`open_questions` from Genovi → human reviewer in Verify portal → answers flow back to the project. This closes the "factory needs human input" loop.

### Phase 12 — Admin Module
`slot_configurations` for intake: currently one implementation (`langgraph-gemini-structured`). Future swap candidates: `hermes-gateway-intake`, `fine-tuned-requirements-extractor`. Admin UI allows per-project override.

## Stats

- **1 session** used (timeboxed 1-2 sessions; delivered under)
- **~$0.003** spent on LLM calls during development
- **1 critical bug fix**: included worked JSON example in prompt
- **3 files** created: schema, genovi.js, phase docs (x4)
- **5 files** modified: router/backends/adapter for max_tokens, llm-routing.json, decisions
- **1 infrastructure addition**: `max_tokens` flows through the whole router stack

## Phase 3 exit criteria — met with scope narrowing

- ✅ `intake` task tier in `configs/llm-routing.json`
- ✅ `requirements.schema.json` defined
- ✅ `runGenovi()` works as a library — tested with real LLM call
- ✅ A0 markdown renderer produces valid, readable output
- ⏳ Wiring into `pre_dev_graph.js` + `/api/factory/pre-dev` rewire → **deferred to Phase 4** (documented decision)
- ✅ Smoke test with real scope doc passes
- ✅ Cost row in `llm_calls` tagged correctly

Phase 3 is **Genovi-as-library, shipped and working**. Phase 4 makes it part of the live factory flow.
