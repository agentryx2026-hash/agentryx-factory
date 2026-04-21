# Phase 4 — Decisions Log

## D86 — Phase 4 scope re-narrowed after discovering pre_dev_graph.js already LLM-generates

**What**: Original Phase 4 plan (from sketch) envisioned "formalize all 25-30 doc generators." During planning, discovered `pre_dev_graph.js` already has 7 nodes that LLM-generate 11 of the 25 docs (A0-A6, B4, B6, B8, P0, AGENT_STATE). Re-scoped Phase 4 to:
1. Add Genovi as first node (Phase 3 follow-up)
2. Feature-flag the endpoint to spawn the graph instead of template substitution
3. Document all 25 doc metadata in `pmd-registry.json` for Phase 12 admin UI

**Why**: Re-discovering existing work is valuable — most engineering is "what already exists" rather than "what needs building." The remaining 14 template-only docs get LLM-generation in later phases (Phase 5 for B1/B2/B3, Phase 16 for B5/C2/C3, etc.), each handled as needed.

**Outcome**: Phase 4 stays tight (1 session) instead of expanding to "write 14 new agents."

## D87 — Genovi runs BEFORE picard_scope, but does NOT write A0 to disk

**What**: `genoviNode` populates `state.pmdDocs._raw_extraction` (the structured JSON) without writing A0_Source_Analysis.md. Picard's picardScopeNode runs after and writes its own A0.

**Why**:
- Minimal disruption to existing pipeline (Picard's node is unchanged).
- Structured extraction (`_raw_extraction`) is available to downstream nodes for consumption if they want it.
- Avoids the "two A0 files" confusion.
- Picard's A0 is narrative / gap-analysis style (from template); Genovi's structured JSON is requirement-list style — both are valuable in different slots.

**Future enhancement** (Phase 5 or 7): modify picardScopeNode prompt to reference `state.pmdDocs._raw_extraction` and produce a richer A1/A2 based on it. Not in Phase 4's scope.

## D88 — Genovi is non-fatal in the graph

**What**: `genoviNode` wraps `runGenovi()` in try/catch. If extraction fails (API 402, schema mismatch, malformed JSON), we log + emit telemetry + return `{}` — letting downstream nodes use `state.userRequest` directly as today.

**Why**:
- Adding Genovi must not REGRESS existing pre_dev runs. If Genovi's provider is down but Picard's is up, pipeline should still produce docs.
- Telemetry visibility preserved: operator sees `⚠️ Genovi failed` in UI but pipeline continues.
- Consistent with P2 (artifact-first): a run that produces 11/12 docs is still useful.

## D89 — Endpoint rewire is FEATURE-FLAGGED (`PRE_DEV_USE_GRAPH`), not a hard cutover

**What**: `/api/factory/pre-dev` accepts env var `PRE_DEV_USE_GRAPH`:
- `true` → spawn `pre_dev_graph.js` (real LLM pipeline)
- else (default) → existing template substitution (fast/free)

**Why**:
- Current OpenRouter credit state shows 402s on architect tier. A hard cutover would break `/api/factory/pre-dev` production.
- Feature flag = zero user-visible change by default, admin flips when ready.
- One-line rollback if graph misbehaves (`systemctl edit factory-telemetry` → remove the env var).
- Both code paths maintained in parallel during R1-R2 transition.

**Rollback semantics**: toggle flag off → template path resumes immediately. No state corruption.

## D90 — `pmd-registry.json` is documentation-grade, not runtime-critical

**What**: `configs/pmd-registry.json` describes all 25 PMD docs' metadata but is NOT yet loaded/consumed by `pre_dev_graph.js`. It's primarily a reference for Phase 12 admin UI.

**Why** (tradeoff vs. runtime-integration):
- Making the graph data-driven from the registry = significant refactor of pre_dev_graph.js node definitions (turn imperative node code into registry-driven).
- Not worth doing until Phase 12 actually ships the admin UI that CHANGES registry values at runtime.
- For Phase 4, "metadata for future tooling" is the right scope.

**Migration path**: Phase 12 builds the admin UI that reads/writes `pmd-registry.json` (or its Postgres-backed equivalent). At that point, `pre_dev_graph.js` also refactors to be data-driven. Both changes in same phase.

## D91 — CLI banner updated to name Genovi

**What**: `pre_dev_graph.js`'s `main()` CLI banner changed from `Picard(A0+A1+A2) → Sisko(...) → ...` to `Genovi(intake) → Picard(A0+A1+A2) → Sisko(...) → ...`.

**Why**: Trivial, but users who run pre_dev_graph.js directly (via `/api/factory/dev` spawn or CLI) should see Genovi in the pipeline advertisement. Consistent with what actually runs.
