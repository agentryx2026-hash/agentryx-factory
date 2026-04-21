# Phase 4 — PMD Template Registry + Genovi Integration

**Started**: 2026-04-21
**Status**: active

## Context (important — this changed mid-planning)

On first read of Phase 4 I assumed `/api/factory/pre-dev` did template substitution and `pre_dev_graph.js` was a separate unused artifact. **That was wrong.**

Reality:
- `pre_dev_graph.js` ALREADY has 7 LLM-generator nodes for A0-A6, B4, B6, B8, P0, AGENT_STATE (~12 PMD docs via real model calls)
- `picardScopeNode` already produces A0, A1, A2 via `geminiPro` (which is `RouterChatModel({task:'architect'})` when `USE_ROUTER=true`)
- `siskoNode` produces A3, A4, A5
- `picardA6Node` produces A6
- `troiNode` produces B4, B6
- `obrienInfraNode` produces B8
- `picardP0Node` produces P0
- `janeInitNode` initializes AGENT_STATE

**BUT** — `/api/factory/pre-dev` endpoint does template-substitution inline and **never spawns `pre_dev_graph.js`**. So the real LLM pipeline exists but isn't being used in production.

## Goal (re-scoped from the sketch)

**Two changes, narrow:**

1. **Wire Genovi** (Phase 3's standalone library) as a new FIRST node in `pre_dev_graph.js`, before `picard_scope`. Genovi produces structured requirement JSON + a better A0_Source_Analysis.md than Picard's template-based A0.

2. **Rewire `/api/factory/pre-dev`** to spawn `pre_dev_graph.js` (matching the pattern `/api/factory/dev` uses with `dev_graph.js`). Drop the inline template substitution — the graph produces real docs.

**Plus** (documentation, no runtime impact): `configs/pmd-registry.json` — structured metadata for all PMD docs so the admin UI (Phase 12) can list them, track status, allow swap between LLM vs template, etc.

## Scope guard — what's NOT in Phase 4

- NEW agents for remaining docs (B1/B2/B3/B5/B7, C1-C4, P1-P5). These templates exist but aren't yet LLM-generated. Phase 4 leaves them as templates. They become LLM-generated over Phases 4.5 / 5 / 8 as needed.
- A full PMD schema / typed registry with dependency graph. The JSON file is enough; a Prisma-level schema is Phase 12 material.
- Changing existing agent logic (Picard/Sisko/Troi prompts). Those work; leave them.

## Subphases

### 4-A — `configs/pmd-registry.json`

Flat JSON describing each of the ~25 standard PMD docs:
- `id` (e.g. `A0`, `B4`, `P0`)
- `name` (e.g. `Source Analysis`)
- `section` (`solution-scope` | `agentryx-edge` | `project-delivery` | `project-mgmt`)
- `producer_type` (`llm` | `template` | `hybrid`)
- `producer_agent` (e.g. `genovi`, `picard`, `sisko`) — null if template-only
- `producer_node` (e.g. `genoviNode`, `picardScopeNode`) — null if template-only
- `task_tier` (e.g. `intake`, `architect`, `worker`, `cheap`) — null if template-only
- `depends_on` (array of doc IDs)
- `template_file` (path to template if used)
- `output_path` (e.g. `PMD/A0_Source_Analysis.md`)
- `status` in this repo (`live` | `planned` | `deprecated`)
- `description` (one-liner)

This becomes input to Phase 12 admin UI. Zero runtime impact this phase; pure metadata.

### 4-B — `genoviNode` in `pre_dev_graph.js`

Add:
```js
import { runGenovi } from './genovi.js';

async function genoviNode(state) {
  await broadcastTelemetry('genovi', 0, 'working', '🔍 Genovi extracting structured requirements...');
  const result = await runGenovi({
    rawScopeText: state.userRequest,
    projectId: state._projectDir,
    projectDir: state._projectDir,
  });
  await broadcastTelemetry('genovi', 0, 'done', `✅ Extracted ${result.extracted.functional_requirements.length} functional requirements`);
  return {
    pmdDocs: {
      ...state.pmdDocs,
      A0_Source_Analysis: result.markdown,
      _raw_extraction: result.extracted,
    },
  };
}
```

Add edge: `__start__ → genovi → picard_scope` (replaces current direct `__start__ → picard_scope`).

### 4-C — Modify `picardScopeNode` to skip A0 if Genovi already produced it

Minimal change: inside `picardScopeNode`, check `state.pmdDocs['A0_Source_Analysis']`. If already populated (Genovi ran), skip A0 generation, go straight to A1 + A2 using Genovi's structured context.

If Genovi DIDN'T run (e.g. Genovi errored or was disabled), fall back to current behavior — generate A0 from raw text.

### 4-D — Rewire `/api/factory/pre-dev`

Replace the 200+ lines of template substitution logic in the `/api/factory/pre-dev` handler with a spawn call:

```js
const child = spawn('node', ['/home/.../agentryx-factory/cognitive-engine/pre_dev_graph.js', project], {
  cwd: '/home/.../agentryx-factory/cognitive-engine',
  stdio: ['ignore', 'pipe', 'pipe'],
  env: { ...process.env },
});
// wire stdout/stderr to addLog() for live telemetry
```

Preserve the document parsing step (PDF/DOCX→text) since pre_dev_graph expects `state.userRequest` as plain text.

### 4-E — Document fallback toggle

Add `PRE_DEV_USE_GRAPH` env var. If false, endpoint falls back to the OLD template-substitution path (kept as dead code, feature-flagged). Default true after smoke test.

Rationale: the feature flag lets us roll back in one env-var change if pre_dev_graph spawns misbehave in production.

### 4-F — Smoke test

Two levels:
1. **Syntax level** (always runs): `node --check` both modified files. Start factory-telemetry. Confirm service up.
2. **End-to-end** (only if OpenRouter credit sufficient): submit a small scope doc via the dashboard's Pre-Dev tab. Expect: Genovi fires, Picard fires, Sisko fires, docs produced. Monitor via SSE stream.

Given current credit state (402s on architect-tier Opus), **likely defer end-to-end to after credit top-up**. Close Phase 4 at syntax + structural verification.

## Exit criteria

- ✅ `configs/pmd-registry.json` committed with all ~25 doc metadata
- ✅ `genoviNode` in `pre_dev_graph.js` + edge `__start__ → genovi → picard_scope`
- ✅ `picardScopeNode` skips A0 regeneration if Genovi ran
- ✅ `/api/factory/pre-dev` spawns `pre_dev_graph.js` (with feature flag for rollback)
- ✅ Syntax + structural smoke test passes
- ⏳ End-to-end factory run deferred if credit insufficient — documented

## Configurability hook (per P8)

`PMDRegistry` as a data structure is shared between the graph (uses it as source-of-truth for which agents produce what) and the admin UI (Phase 12 — will let Super Admin enable/disable per-project, swap template vs LLM, etc.).

Per-doc `producer_type` swap values: `llm` / `template` / `hybrid`. Per-doc `producer_agent` can be swapped between implementations (`genovi-langgraph` / `genovi-hermes` / `genovi-custom`).
