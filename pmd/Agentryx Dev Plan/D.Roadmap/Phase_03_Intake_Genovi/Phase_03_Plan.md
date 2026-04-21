# Phase 3 — Intake Stage (Genovi)

**Started**: 2026-04-21
**Status**: active

## Goal

Ship the **first new agent** since migration. Genovi takes a raw scope document (SRS / FRS / PRD / TOR / plain text), extracts structured requirements via LLM, and produces a **real** `A0_Source_Analysis.md` — not the template-substitution placeholder the current `/api/factory/pre-dev` endpoint writes.

This closes the loop on the user's original vision: "drop a scope doc → factory produces PMDs → rest of pipeline flows."

## Why this is Phase 3 (not earlier)

The factory infrastructure had to land first:
- Router + cost telemetry (Phase 2) — so Genovi's Gemini-Pro-long-context calls are tracked
- Key Console (Phase 2.5) — so provider keys are live and swappable
- Monorepo (Phase 1.5) — so cognitive-engine code changes version-control cleanly
- Hermes evaluation (Phase 2.75) — so we know the PROD brain-layer stays LangGraph; Genovi is a LangGraph node

With that plumbing in place, adding an agent is a small code change.

## Scope — narrow, V0-level

**In scope**:
- New LangGraph node `genoviNode` in `cognitive-engine/pre_dev_graph.js`, placed BEFORE the current `picardNode`
- Uses router `task: 'intake'` (new task tier)
- Structured extraction: functional/non-functional requirements, actors, constraints, assumptions, acceptance criteria, open questions
- Emits JSON blob → transforms to Markdown → writes `A0_Source_Analysis.md` for this project
- `A0_Source_Analysis.md` added to `state.pmdDocs['A0']` so Picard/Sisko/Troi see it
- `/api/factory/pre-dev` endpoint updated to SPAWN `pre_dev_graph.js` instead of template-substituting

**Out of scope** (Phase 4 — PMD Template Registry):
- Upgrading A1-B9 docs from template-substitution to real LLM generation
- Formalizing the full 25-30 PMD document standard as a typed registry
- Per-document dependency graph (A2 depends on A1, A3 depends on A2, etc.)

Phase 3 is **one document done really well**, not all docs done shallowly.

## Subphases

### 3-A — Add `intake` task tier to router config

Add to `configs/llm-routing.json`:
```json
"intake": {
  "description": "Raw scope doc → structured requirements. Long context, structured output.",
  "primary": "openrouter:google/gemini-2.5-pro",
  "fallbacks": [
    "openrouter:anthropic/claude-sonnet-4-6",
    "openrouter:openai/gpt-5"
  ]
}
```

Rationale: Gemini 2.5 Pro has 2M context window, handles large SRS docs natively, cheap vs Claude Opus. Sonnet and GPT-5 as fallbacks.

### 3-B — Define requirements extraction schema

File: `cognitive-engine/schemas/requirements.schema.json` (new).

Structured JSON output shape:

```json
{
  "project_summary": "<one-sentence description>",
  "domain": "<e.g. e-commerce | finance | healthcare | devtools | other>",
  "primary_actors": ["<role>", ...],
  "functional_requirements": [
    { "id": "FR-001", "priority": "MUST|SHOULD|COULD|WILL_NOT", "description": "..." }
  ],
  "non_functional_requirements": [
    { "category": "performance|security|reliability|usability|accessibility|other", "description": "..." }
  ],
  "constraints": ["..."],
  "assumptions": ["..."],
  "acceptance_criteria": ["..."],
  "open_questions": ["..."],
  "scope_exclusions": ["..."],
  "estimated_complexity": "small|medium|large|xl",
  "recommended_tech_stack_hints": ["..."]
}
```

### 3-C — Write `genoviNode` in `pre_dev_graph.js`

New node, runs first:

```js
async function genoviNode(state) {
  await broadcastTelemetry('genovi', 0, 'working', '🔍 Extracting structured requirements...');
  const model = USE_ROUTER ? new RouterChatModel({ task: 'intake', projectId: state._projectDir, agent: 'genovi' }) : /* ... */;
  const extractionPrompt = buildExtractionPrompt(state.userRequest);
  const response = await model.invoke([
    new SystemMessage(INTAKE_SYSTEM_PROMPT),
    new HumanMessage(extractionPrompt),
  ]);
  const extracted = parseAndValidateJSON(response.content, requirementsSchema);
  const a0Markdown = renderA0Markdown(extracted);
  await fileWriteTool(`${state._projectDir}/PMD/A0_Source_Analysis.md`, a0Markdown);
  return {
    ...state,
    pmdDocs: { ...state.pmdDocs, A0_Source_Analysis: a0Markdown, _raw_extraction: extracted },
  };
}
```

Add edge: `genovi → picard` at the start of the graph.

### 3-D — Markdown renderer for A0

Function `renderA0Markdown(extracted)` produces a properly-formatted A0_Source_Analysis.md with:
- Executive summary
- Domain classification
- Primary actors table
- Functional requirements table (ID / Priority / Description)
- Non-functional requirements by category
- Constraints / Assumptions (bulleted)
- Acceptance criteria (checklist)
- Open questions (to surface to user for Phase 9 review queue later)
- Scope exclusions
- Estimated complexity + tech stack hints

### 3-E — Rewire `/api/factory/pre-dev`

Current: writes 12 templated PMD files directly in the telemetry.mjs handler.

New: spawn `pre_dev_graph.js` (same pattern as `/api/factory/dev` spawns `dev_graph.js`). The graph handles all 12 docs, with Genovi doing real A0 and existing template logic handling A1-B9 for now (upgraded in Phase 4).

### 3-F — Smoke test with a real SRS

Test document: a simple SRS for a TODO app. Hit `/api/factory/pre-dev` with it. Expected:
1. Genovi emits "Extracting structured requirements..." telemetry
2. Produces valid JSON per schema
3. `A0_Source_Analysis.md` has real extracted requirements (not placeholder text)
4. Cost row appears in `llm_calls` with `agent='genovi'`, `task_type='intake'`
5. Picard sees `state.pmdDocs['A0']` and uses it (if pre_dev_graph.js runs further)

### 3-G — Close

Update Status, write Lessons, close phase.

## Exit criteria

- ✅ `intake` task tier in `configs/llm-routing.json`
- ✅ `requirements.schema.json` defined
- ✅ `genoviNode` function in `pre_dev_graph.js`, edge `genovi → picard`
- ✅ A0 renderer produces valid Markdown from JSON
- ✅ `/api/factory/pre-dev` spawns `pre_dev_graph.js` instead of template-substituting
- ✅ Smoke test with a real scope doc — extracted JSON has at least 5 functional requirements and produces readable A0
- ✅ Cost row in `llm_calls` tagged with `agent='genovi'`, `task_type='intake'`

## Configurability hook (per P8)

`GenoviImpl` interface — for future swap-in implementations (Hermes-backed intake, custom in-process, etc.). For R1 we have one implementation: `langgraph-gemini-structured`. At R3/R4, if we want to A/B an alternative (e.g. a fine-tuned model specifically for requirements extraction), we add a row to `slot_configurations` with `slot='intake_extractor'`.

## Risks

| Risk | Mitigation |
|---|---|
| LLM returns malformed JSON | Parser validates against schema; on failure, retry with "output valid JSON only" reminder; on second failure, fall back to template mode with error logged |
| Long scope doc exceeds cheap-tier context | Primary is Gemini 2.5 Pro (2M context). Fallback models in chain. If all fail on context, chunk the doc (deferred to Phase 4) |
| Cost spike on large docs | Budget cap (Phase 2E) catches per-project cost; per-call cap via `max_tokens` still 4096 |
| Picard/Sisko/Troi break on new A0 format | They currently only read from `state.pmdDocs['A0_Source_Analysis']` as text. Our JSON → Markdown output IS text. Tested via smoke run. |
