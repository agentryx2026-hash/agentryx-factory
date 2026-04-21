# Phase 4 — Status: COMPLETE ✅

**Phase started**: 2026-04-21
**Phase closed**:  2026-04-21
**Duration**: single session (re-scoped after discovery that pre_dev_graph.js already existed with 7 LLM nodes)

## Subphase progress

| Sub | What | Status |
|---|---|---|
| 4-A | `configs/pmd-registry.json` | ✅ done — 25 doc metadata entries |
| 4-B | `genoviNode` in `pre_dev_graph.js` + edge | ✅ done — `__start__ → genovi → picard_scope` |
| 4-C | Non-fatal Genovi (falls through on error) | ✅ done — try/catch with telemetry + fall-through |
| 4-D | Feature-flagged endpoint rewire (`PRE_DEV_USE_GRAPH`) | ✅ done — default off, toggles via env |
| 4-E | Syntax + restart verification | ✅ done — factory-telemetry active, default path working |

## What shipped

### `configs/pmd-registry.json` (new)
25 PMD doc metadata entries with:
- `id`, `name`, `section`, `producer_type` (llm/template), `producer_agent`, `producer_node`, `task_tier`, `depends_on`, `template_file`, `output_path`, `status`, `description`
- Stats: 11 LLM-generated, 14 template-only (current state)
- Sections: solution-scope (7), agentryx-edge (9), project-delivery (4), project-mgmt (6)
- Becomes Phase 12 admin UI's source of truth

### `cognitive-engine/pre_dev_graph.js` (modified)
- New `genoviNode` function — dynamic import of `./genovi.js`, non-fatal on error
- Workflow updated: 8 nodes, edge `__start__ → genovi → picard_scope → ...`
- CLI banner updated: `Pipeline: Genovi(intake) → Picard(A0+A1+A2) → Sisko(...) → ...`
- Syntax clean, USE_ROUTER=true path unaffected

### `factory-dashboard/server/telemetry.mjs` (modified)
- `/api/factory/pre-dev` now has two paths:
  - **`PRE_DEV_USE_GRAPH=true`**: spawn `cognitive-engine/pre_dev_graph.js` (real LLM pipeline, 1-2 min, ~$0.50-2.00 per run)
  - **default (flag unset or false)**: existing template substitution (instant, free)
- Flag tested via restart; default path confirmed working

## Why feature-flagged instead of hard-cutover

OpenRouter credit is currently insufficient to support the architect-tier calls in the full pre_dev graph (seen as 402s during Phase 3). A hard cutover would break `/api/factory/pre-dev` in production.

Feature flag means:
- Zero user-visible change by default
- Admin flips `PRE_DEV_USE_GRAPH=true` in `deploy/systemd/factory-telemetry.service` when credit tops up
- One-line rollback if the graph misbehaves
- Both code paths stay maintained in parallel during R1-R2 until we're confident

## End-to-end verification deferred

Full end-to-end smoke test (submit real scope doc → watch Genovi → Picard → Sisko → ... → 12 real LLM docs written) requires:
- OpenRouter credit top-up (current: 402s on architect tier)
- OR: temporary task-config downshift of architect tier to Haiku/Sonnet-via-OpenRouter (cheaper, still capable)

Documented for when user tops up credit OR decides to shift architect tier. Not blocking Phase 4 close — structural integration is complete and verified.

## Credit-aware config tip (for when we test end-to-end)

To run pre_dev_graph on tight credit:
1. Edit `configs/llm-routing.json` — temporarily swap `architect` primary to `openrouter:anthropic/claude-haiku-4-5` (or `openrouter:google/gemini-2.5-flash`)
2. Set `PRE_DEV_USE_GRAPH=true` in `deploy/systemd/factory-telemetry.service`
3. `sudo systemctl daemon-reload && sudo systemctl restart factory-telemetry`
4. Submit small scope via dashboard
5. Revert architect tier to Opus after top-up

Budget estimate for a small-scope pre-dev run on Haiku: ~$0.05-0.15 total (vs ~$1-2 on Opus).
