# Phase 15 — Self-Improvement Loop

**One-liner**: Agents propose changes to the pipeline (graph topology, prompts, model assignments) based on observed failures and lessons. All proposals gated by Super Admin approval before merge.

**Updated 2026-04-21 after Phase 2.75 evaluation**:

Hermes ships a `Tinker-Atropos` submodule implementing **RL-based trajectory collection** — the plumbing for self-improvement. When Phase 15 becomes active:

1. Study Tinker-Atropos's approach (how trajectories are scored, how improvements propagate back).
2. Evaluate: port the pattern to our factory OR run Hermes as a dedicated "learning observer" service that watches our LangGraph runs and proposes changes.
3. This is far-future (Phase 15 ≈ week 8+). Defer real design until then.

**Do NOT adopt in v0.0.1** — both the underlying problem (self-improvement) and the candidate solution (RL trajectory collection) are ahead of our current maturity.

*(sketch — expanded when phase becomes active)*
