# Agent Delegation Model

**Goal**: Use the right model (and the right type of agent) for each task. Cost-tiered. The Solution Architect (this Claude session) delegates to cheaper / specialized agents wherever feasible.

## Two distinct things called "agent"

1. **Pipeline agents** — the named in-graph agents (Picard, Sisko, Troi, Jane, Spock, Torres, Tuvok, Data, Crusher, O'Brien, future Genovi, Hermes). They run inside `cognitive-engine` as LangGraph nodes. Each can be assigned an LLM tier.

2. **Meta-agents** — the agents that *build* the factory itself (e.g. Claude Code session you're reading now). They don't appear in the dev pipeline; they implement, modify, and observe it.

This document covers both.

## Pipeline agent → model tier mapping (Phase 2 default config)

| Agent | Stage | Default Model | Why |
|---|---|---|---|
| Genovi *(new, Phase 3)* | Intake — SRS/FRS/PRD ingestion | Claude Sonnet 4.6 or Gemini 2.5 Pro | Long context (multi-doc), structured output |
| Picard | Architect | Claude Opus 4.7 or GPT-5 | Hardest reasoning task |
| Sisko | Triage / scope | Sonnet 4.6 | Structured but complex |
| Troi | Research / dossier | Gemini 2.5 Flash + web search | Cheap + fast for breadth |
| Jane | Pre-dev planning | Sonnet 4.6 | Planning + structured output |
| Spock | Implementation | Claude Sonnet 4.6 / Aider / OpenHands | Code generation. Compare options. |
| Torres | Code refinement | Sonnet 4.6 | Iterative |
| Tuvok | Test generation + run | Sonnet 4.6 | Structured (matches test specs) |
| Data | QA review | Opus 4.7 | Adversarial reasoning |
| Crusher | Architect review | Opus 4.7 | Final gate |
| O'Brien | Deploy / commit / PR | Haiku 4.5 | Mostly mechanical (git, CI) |
| Hermes *(new, Phase 10)* | External comms | Haiku 4.5 | Mostly templated outputs |

These are **defaults**. Per Principle 1 (configurability), the admin UI in Phase 2 lets you override per-agent at runtime.

## Meta-agent delegation (when building the factory itself)

This Claude Code session acts as **Solution Architect**. It should delegate to cheaper agents whenever possible:

| Task type | Suggested delegation |
|---|---|
| Wide codebase exploration | `Agent` tool with `Explore` subagent (Sonnet) — protects main context window |
| Plan an implementation | `Agent` tool with `Plan` subagent |
| Research a single library / API | `Agent` tool with `general-purpose` (Haiku for simple, Sonnet for nuanced) |
| Boilerplate file generation | Inline (Opus is overkill but the cost of delegating ≈ cost of doing it) |
| Architectural decisions | Solution Architect (this session) directly — high stakes, full context needed |
| Reading and synthesizing 10+ files | `Agent` with `Explore` — bring back a summary, not the raw files |

**Rule of thumb**: if a task is "find / read / summarize," delegate to a sub-agent. If it's "decide / design / commit to a tradeoff," do it inline.

## Cost discipline

- Every Phase records its actual model spend in `Phase_NN_Lessons.md` at close.
- Phase 11 builds a cost dashboard that makes this real-time.
- Until Phase 11, track informally (Anthropic console, Gemini console, OpenRouter dashboard).

## Configurability hooks

The admin UI (Phase 12 — B7 module) will expose:

- Per-agent model override (with cost preview)
- Per-task model selection (for ad-hoc runs)
- Hard budget caps per project, per agent, per day
- A/B compare mode (run same task on N models, present outputs side-by-side)
