# Phase 3 — Decisions Log

## D76 — Genovi is a LangGraph node, not a separate service

**What**: Genovi lives inside `cognitive-engine/pre_dev_graph.js` as a new node function, NOT a separate microservice on its own port.

**Why**: The Hermes evaluation (Phase 2.75 D74) confirmed cognitive-engine stays as our agent runtime. Adding a new agent means adding a new node — same pattern as Picard/Spock/Torres.

## D77 — Gemini 2.5 Pro is the intake tier's primary model

**What**: `configs/llm-routing.json` adds `intake` task tier with `openrouter:google/gemini-2.5-pro` as primary.

**Why**:
- **Context window**: Gemini 2.5 Pro has 2M token context. Real-world SRS docs can be 50-200 pages. Claude Sonnet's 200K gets tight; Opus's 200K + extended thinking is overkill for extraction.
- **Structured output**: Gemini's native JSON mode is reliable.
- **Cost**: $1.25/MTok input vs Sonnet $3.00 / Opus $15.00 — 2-12× cheaper for this task.

Fallbacks: Claude Sonnet 4.6 (if Gemini 429s), GPT-5 (if Anthropic also 429s).

## D78 — Structured output via prompt + JSON.parse, NOT `.withStructuredOutput()`

**What**: Genovi sends a prompt like "output ONLY valid JSON in this schema: {...}" and parses the response text. Doesn't use LangChain's `.withStructuredOutput(schema)`.

**Why**:
- **Portability**: our `RouterChatModel` adapter (Phase 2B) is duck-typed to `.invoke()` only. Adding `.withStructuredOutput` support means more framework-specific code.
- **Provider consistency**: `.withStructuredOutput` uses provider-specific mechanisms (function calling for OpenAI, JSON mode for Gemini, etc.). Hand-rolled prompt + parse works identically across all providers in our fallback chain.
- **Validation**: we validate against JSON schema ourselves (via Ajv or similar) for clear error messages.

**Tradeoff**: slightly more tokens spent on "output JSON only" instructions. Acceptable (~100 tokens, < $0.001 per call).

## D79 — Genovi produces A0 ONLY in this phase; A1-B9 stay templated until Phase 4

**What**: Phase 3 scope is "one document done really well," not all docs done shallowly.

**Why**:
- Gives Phase 4 a clear scope (the formal PMD Template Registry)
- Avoids turning Phase 3 into "rewrite the whole pre-dev pipeline"
- A0 is the most valuable doc to get right — it's what Picard reads first

**Migration path to Phase 4**: Phase 3's Genovi + A0 renderer become the template for how every other document in A1-B9 gets built (each has its own agent + its own renderer).

## D80 — `/api/factory/pre-dev` becomes a spawn-point, not a writer

**What**: The telemetry.mjs handler stops writing 12 templated PMD docs itself. Instead, it spawns `pre_dev_graph.js` (same pattern as `/api/factory/dev` spawns `dev_graph.js`).

**Why**:
- The graph can orchestrate Genovi + Picard + Sisko + Troi properly, with state passed between nodes.
- Async spawn + SSE telemetry means user sees real progress ("Genovi extracting...", "Picard architecting...") instead of instant "12 Docs generated" lie.
- Easier to debug via dev_graph.js's existing telemetry conventions.

**Risk**: if pre_dev_graph.js fails, user sees no PMDs. Mitigation: graceful error capture in the graph; ensure A0 at minimum is written even if later nodes fail. Also: current template-substitution code is preserved as a fallback path (feature-flag: `PRE_DEV_USE_GRAPH=true`) so we can revert the change without losing the templated behavior.

## D81 — Genovi's configurability hook per P8 (tool-swap flexibility)

**What**: Genovi implementation is named `langgraph-gemini-structured`. The `slot_configurations` table (when Phase 12 builds it) will allow alternatives.

**Possible future alternatives**:
- `hermes-gateway-intake` — if we want Hermes to handle intake via a Slack channel
- `fine-tuned-requirements-extractor` — a custom small model at R3+ trained on our factory's historical intake data
- `obsidian-template-based` — a degraded mode that does structured template substitution without LLM (for air-gapped or cost-zero runs)

For R1: only `langgraph-gemini-structured` exists. Documented so future swap is straightforward.

---

## Decisions made during execution (captured inline per process discipline)

### D82 — Provide a worked JSON EXAMPLE in the extraction prompt, not just a schema reference

**What**: `buildExtractionPrompt()` includes a concrete JSON example with the EXACT field names, enum values, and nested structure Gemini should produce. The schema file is reference; the example is the contract.

**Why**: First attempt passed schema description ("required: [...], properties: [...]"). Gemini produced reasonable JSON but with wrong field names (`requirement_id` instead of `id`). Second attempt with a worked example: first-shot success. **LLMs follow examples way better than abstract schemas.**

**Tradeoff**: ~300 tokens of prompt overhead per call. At intake tier (cheap Flash), that's ~$0.00005 per call. Trivial cost for reliable output.

### D83 — Per-task `max_tokens` config in `llm-routing.json`, plumbed through the whole router

**What**: Added `max_tokens` to task definitions. Router resolves call > task-config > global-default. Router's `complete()`, all 5 backend functions, and `RouterChatModel` constructor all forward `maxTokens` param.

**Why**: Original hardcoded 4096 (Phase 2 D17.1) was a reasonable default but inflexible. OpenRouter's credit-reservation-on-max_tokens model means a task that outputs 500 tokens still "costs" 4096 tokens of reserved credit. At low account balance, this failed. Per-task caps = appropriate reservation = works at low balance + cheaper in aggregate.

**Schema stability**: `max_tokens` is optional. Tasks without it fall to global default. No breaking change.

### D84 — Downshift intake primary from Gemini Pro to Gemini Flash (operational, not architectural)

**What**: intake task primary is now `openrouter:google/gemini-2.5-flash`. Fallbacks reorder to Haiku → Pro → Sonnet.

**Why**: OpenRouter balance too low for Pro/Sonnet/GPT-5 at 4096 tokens. Flash handles intake extraction well (7/7 FRs correctly extracted in smoke test) and costs ~1/10th of Pro.

**Restoration plan**: When OpenRouter balance tops up, flip primary back to Pro for larger docs. Flash stays as first fallback (cost-optimized for cheap docs). This is in the `_comment` field in the config so future operators see the history.

### D85 — Scope narrowing: deliver Genovi-as-library in Phase 3; integration moves to Phase 4

**What**: Phase 3 ships `genovi.js` as a standalone module. Wiring into `pre_dev_graph.js` + rewiring `/api/factory/pre-dev` both move to **Phase 4 (PMD Template Registry)**.

**Why**:
- Phase 4 already scoped to tackle the "make all 12 PMDs real" problem. Genovi-integration is a natural sub-task of that.
- Avoids two consecutive phases both touching `/api/factory/pre-dev`.
- Standalone Genovi is independently testable — done, proven.
- Agile scope-narrowing is better than broken overreach.

**Risk**: Phase 4 now has a slightly fuller plate. Acceptable — Phase 4 was already going to iterate on pre_dev_graph.js for the other docs.
