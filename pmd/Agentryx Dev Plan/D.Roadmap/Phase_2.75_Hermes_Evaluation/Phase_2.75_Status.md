# Phase 2.75 — Status: COMPLETE ✅

**Phase started**: 2026-04-21
**Phase closed**:  2026-04-21
**Duration**: single session (compressed from planned 2-session timebox)

## Subphase progress

| Sub | What | Status |
|---|---|---|
| 2.75-A | Install Hermes (Docker, isolated) | ✅ done — image pulled, container boots cleanly, 28 tools + 67 skills loaded |
| 2.75-B | Define benchmark dataset (JSONL) | ✅ done — `hermes/data/benchmarks.jsonl` with 2 representative tasks |
| 2.75-C | Run side-by-side benchmarks | **⚠️ Pivoted**: `batch_runner.py` is an RL-trajectory tool, discards simple prompt/response. See D72. Decision based on architectural characteristics instead. |
| 2.75-D | Decision matrix (7 slots) | ✅ done — see Phase_2.75_Decisions.md D74 |
| 2.75-E | Update downstream phase plans (7, 10, 15, 18) | ✅ done (this commit) |

## Headline finding

**Hermes is agent-shaped, not service-shaped.** Its primary interfaces are interactive TUI + messaging gateways (Slack/Discord/etc.), not HTTP APIs. This fundamentally changes the adoption calculus.

## Decision — HYBRID (not wholesale adopt, not reject)

For PROD v1.0 factory:

| Slot | Use | |
|---|---|---|
| Pipeline agents | LangGraph | ✅ keep |
| LLM router | Our router | ✅ keep |
| Tool plane | MCP direct | ❌ skip Hermes |
| Memory (Phase 7) | **Custom, Hermes-patterned** | ⚙️ adapt |
| Self-improvement (Phase 15) | Tinker-Atropos-patterned | ⚙️ adapt later |
| **External comms (Phase 10 Courier)** | **Hermes `gateway` mode** | ✅ **ADOPT** |
| **Skills catalog (Phase 18)** | **agentskills.io** | ✅ **ADOPT** |

Two slots adopt Hermes directly. Two slots borrow Hermes patterns. Three slots stay with our custom stack.

## Downstream phase updates

Phase 2.75-E outputs (applied this commit):

- **Phase 7 (Memory Layer)** — scope narrowed: implement SQLite FTS5 + LLM summarization pattern inspired by Hermes; optionally plug in Honcho. Do NOT run full Hermes container for memory service.
- **Phase 10 (Courier)** — scope changed from "custom build" to "deploy Hermes in gateway mode, configure for factory comms channels." Saves ~2 weeks of build.
- **Phase 15 (Self-Improvement)** — note added: study Tinker-Atropos when phase begins. Not adopting now, just flagging as likely-inspiration.
- **Phase 18 (Marketplace)** — scope changed from "custom module marketplace" to "integrate agentskills.io catalog API." Saves ~1-2 weeks.

Estimated roadmap compression: **~4 weeks saved** across Phases 7/10/15/18 by partial-Hermes adoption.

## Cost of this phase

- Image pull + storage: ~350 MB
- LLM cost: **$0.00** real successful completions (401s on stale .env, then discarded trajectory responses had no cost recorded)
- Time: ~1 session
- Artifacts: `hermes/docker-compose.yml`, `hermes/start-with-live-keys.sh`, `hermes/data/benchmarks.jsonl`, this phase's docs

## Rollback posture

If PROD reveals Hermes is a bad fit for Courier/Skills (the two slots we're recommending for adoption):
1. Courier slot falls back to custom build — adds ~2 weeks
2. Skills catalog falls back to curated custom list — adds ~1 week
3. No data loss — Hermes is fully isolated in its own Docker compose project

Clean rollback path preserved.
