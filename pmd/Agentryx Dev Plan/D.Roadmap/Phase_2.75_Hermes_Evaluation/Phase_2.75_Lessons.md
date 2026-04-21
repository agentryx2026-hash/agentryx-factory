# Phase 2.75 — Lessons Learned

Phase closed: 2026-04-21. Duration: single session (compressed from 2-session timebox).

## What surprised us

1. **Hermes is agent-shaped, not service-shaped** — this was the critical finding. We expected an HTTP API we could call from our factory. What we found: interactive TUI + 6 messaging gateways + CLI subcommands. Integration requires subprocess management (Paperclip's domain) OR webhook-based gateway mode, NOT simple REST calls. This FUNDAMENTALLY changes the adoption calculus.

2. **The evaluation produced its deliverable (decision matrix) without benchmark numbers.** Going in, we assumed we'd measure cost/latency/quality. We learned the QUESTION was "what integration shape does Hermes have?" — not "how fast does Hermes run?" Answered in the decision matrix.

3. **Hermes's `batch_runner.py` is for RL trajectory collection, not completions.** The name is misleading. It expects reasoning tokens + tool calls; discards simple prompt/response pairs. If ever needed for our use: use `hermes gateway` or write a stdin/stdout adapter.

4. **`.env` files become stale after admin-UI rotation.** An entire class of integration bugs emerged because external tools read `.env` but rotation writes to the encrypted DB. Wrote `hermes/start-with-live-keys.sh` to fetch from DB. Pattern will repeat for any external tool we integrate; factor into Phase 12 admin module design (auto-export .env from DB? or a fetcher helper like this?).

5. **Roadmap compression is real** — 4 weeks saved across Phases 7/10/15/18 by partial Hermes adoption. Without this evaluation, we'd have custom-built:
   - A 6-platform messaging integration (Phase 10 — Hermes covers it)
   - A skills catalog framework (Phase 18 — agentskills.io covers it)
   - A memory system from scratch (Phase 7 — Hermes's pattern is implement-able)
   - A self-improvement mechanism (Phase 15 — Tinker-Atropos inspires)

6. **Configurability-first principle validated.** The decision isn't "adopt or reject Hermes." It's "adopt Hermes for SLOTS WHERE IT EXCELS (gateways, skills), build our own where we need tighter control (pipeline runtime, router)." The hybrid answer is more nuanced than either binary.

## What to do differently

1. **Ask "what SHAPE is this tool?" before benchmarking capabilities.** Benchmarks measure performance; shape determines integrability. We got there eventually, but 1 session earlier would have been faster.

2. **Pre-read the upstream README for "how do you invoke this programmatically" before committing to evaluation.** Hermes's docs make its interactive nature clear if you look for it. I skipped that step, assumed HTTP, and had to learn the hard way.

3. **Treat roadmap phase impacts as a FIRST-CLASS output of evaluation phases.** Phase 2.75-E (updating Phases 7/10/15/18 plans) was as valuable as the benchmark that never ran. Each evaluation phase should explicitly include "what does this change about future phases?" as a deliverable.

## What feeds next phases

### Phase 3 (Intake / Genovi)
No direct Hermes impact. Genovi is an intake agent — Picard-pattern, LangGraph node. Proceed as planned.

### Phase 5 (MCP Tool Plane)
Hermes uses MCP under the hood. Phase 5 can skip intermediate abstractions and go straight to MCP SDK. We'll probably want `@modelcontextprotocol/sdk` (JS) in cognitive-engine.

### Phase 7 (Memory)
Updated in-place with concrete plan referencing Hermes's pattern. Implementation: SQLite FTS5 + LLM summarization via our router. Evaluate Honcho addition.

### Phase 9 (Verification Queue)
No Hermes impact. Integrate with existing Verify portal (`verify-stg.agentryx.dev`).

### Phase 10 (Courier)
Updated with concrete adoption plan — Hermes gateway mode.

### Phase 15 (Self-Improvement)
Updated with pattern-study plan (Tinker-Atropos).

### Phase 18 (Marketplace)
Updated with `agentskills.io` adoption plan.

## Stats

- **1 commit** (this phase close)
- **15 Decisions** captured (D62–D75)
- **~350 MB** Docker image pulled and kept
- **$0.00** successful LLM spend (all benchmark attempts 401'd or discarded)
- **0 real benchmark numbers** produced — decision matrix based on architectural observation
- **~4 weeks** of Phase 7/10/15/18 build time saved through partial adoption

## Phase 2.75 exit criteria — met (with caveats)

- ✅ Hermes installed and verified working on VM
- ⚠️ Benchmark numbers NOT produced — pivoted to architectural evaluation per D72/D75
- ✅ Decision matrix filled (7 slots × 4 options)
- ✅ Downstream phase plans updated (7, 10, 15, 18)
- ✅ Decision captured with full reasoning

Caveat: quantitative benchmarks deferred. Can be retroactively added if Phase 7 memory evaluation or Phase 10 courier deployment reveals the need for hard numbers. Currently not blocking any decision.
