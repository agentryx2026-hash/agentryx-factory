# Phase 4 — Lessons Learned

Phase closed: 2026-04-21. Duration: single session.

## What surprised us

1. **Pre_dev_graph.js was already doing the hard work — just not connected.** I planned to build from scratch, then discovered 7 LLM-generator nodes already existed covering 11 of 25 PMD docs. The REAL missing piece was that `/api/factory/pre-dev` never spawned the graph — it did inline template substitution as a shortcut. Phase 4 became "connect existing work" rather than "build new."

2. **"Read the existing code before scoping the phase"** should be a formal pre-requisite of every phase plan. Twice now (Phase 3 discovering pre_dev_graph structure mid-plan, Phase 4 discovering its completeness) my sketch scope was based on incomplete knowledge. Adding to process discipline memory.

3. **Feature-flagging a production code-path swap is cheaper than it looks.** Adding `PRE_DEV_USE_GRAPH` took ~20 lines. Preserves existing behavior, enables new behavior, zero runtime cost when flag unset. This is a pattern worth using liberally for any cutover in R1-R2.

4. **Non-fatal nodes are the right default for added-value agents.** Genovi ADDS structured extraction to the pipeline, but pipelines that previously worked without Genovi should still work without it. Try/catch + fall-through is more robust than "Genovi failed → whole pipeline aborts."

5. **A JSON registry for a future admin UI is cheap to write now.** `pmd-registry.json` took ~20 min. It becomes Phase 12 admin UI's source-of-truth. Writing it during Phase 4 (when the author has the full context of what each doc does) is cheaper than Phase 12 trying to reverse-engineer intent from node code.

## What to do differently

1. **Pre-phase code survey, written into Plan.md before execution starts.** Next phase where I'll touch existing code: first action is `grep` + file read + summarize WHAT EXISTS. Then scope on top of that reality.

2. **Never hard-cutover a production endpoint. Always feature-flag.** Especially when the new path has higher cost (here: LLM calls vs template substitution) or longer latency (1-2 min vs instant).

3. **"Documentation-grade" artifacts (like pmd-registry.json) are valid deliverables.** They don't need to be runtime-loaded to be useful. Shipping documentation that crystallizes tacit knowledge is often more valuable than shipping more code.

## What feeds next phases

### Phase 5 — MCP Tool Plane
No direct dependency. Happens in parallel / independently.

### Phase 7 — Memory Layer
Genovi's `state.pmdDocs._raw_extraction` is a natural input. Memory should remember "we extracted N requirements from project X, which ones were trouble." Cross-session: "last time we saw a TODO app, we missed the real-time sync spec" — feeds Genovi's next intake.

### Phase 9 — Verification Queue
Genovi's `open_questions` output → Verify portal review items → human answers flow back. Close the factory-needs-human loop.

### Phase 12 — B7 Full Admin Module
`pmd-registry.json` is the starting schema. Phase 12 turns this into a Postgres table backing an admin UI: enable/disable docs per project, swap template ↔ LLM, track generation status per doc per project.

## Stats

- **1 session**
- **~$0.00 spent** (no new LLM calls — Phase 3's Genovi was already verified working; Phase 4 just wired it in)
- **3 files modified**: pre_dev_graph.js (genoviNode + edges + CLI banner), telemetry.mjs (PRE_DEV_USE_GRAPH), configs/llm-routing.json (no-op here, retained from Phase 3)
- **1 file created**: configs/pmd-registry.json (25 docs, ~200 lines)
- **4 phase docs**: Plan expanded, Status, Decisions, Lessons
- **5 Decisions**: D86-D90 plus a minor D91

## Phase 4 exit criteria — met

- ✅ `configs/pmd-registry.json` committed with 25 doc metadata entries
- ✅ `genoviNode` added to `pre_dev_graph.js` with edge `__start__ → genovi → picard_scope`
- ✅ Non-fatal Genovi error handling (try/catch + fall-through)
- ✅ `/api/factory/pre-dev` spawns `pre_dev_graph.js` behind `PRE_DEV_USE_GRAPH` feature flag
- ✅ Syntax + structural smoke test passes (factory-telemetry restarted cleanly, default path still works)
- ⏳ End-to-end factory run deferred until OpenRouter credit tops up — documented in Status

Phase 4 is **wired and ready**. Flip the flag when credit is sufficient, or after an architect-tier downshift to Haiku for a cheap smoke test.
