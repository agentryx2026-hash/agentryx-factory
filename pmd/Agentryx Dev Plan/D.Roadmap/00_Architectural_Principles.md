# Architectural Principles

These are the foundational decisions that constrain every phase. Change deliberately, not casually.

## 1. Configurability over commitment

**Wherever there are options, support all reasonable ones, selectable from the admin UI.**

Examples:
- LLM router: LiteLLM (self-hosted) AND OpenRouter (hosted) — both available, switchable per request.
- Memory: Obsidian vault AND vector DB AND Letta — all live, comparable.
- Code agents: raw LLM AND Aider AND OpenHands — try all three on the same task and compare outputs.

**Why**: We are at v0.0.1 — R&D / experimentation. The goal is to learn which approach works best, not to ship one opinion. v1.0 will lock in winners; until then, optionality has more value than simplicity.

**How to apply**: When you face a "framework A vs framework B" choice, build both behind a switch. If timeline doesn't allow both, build A first but design the interface so B is a future plug-in.

## 2. Agile, sketch-then-detail

Only the **next 1-2 phases** are detailed. Future phases are one-liners until ratified.

Each phase has 4 standard files: `Plan`, `Status`, `Decisions`, `Lessons`. Plan starts as a one-liner, expands when the phase becomes active. Status / Decisions / Lessons are created when the phase starts.

**Why**: Every phase teaches something that changes the next. Pre-specifying phase 12 today wastes effort and locks in wrong assumptions.

## 3. Verify portal and Documentation are SEPARATE modules

Factory **integrates with** them, doesn't subsume them. They have own deploy, own UI, own data model. Factory consumes them via webhooks / API.

**Why**: They serve different lifecycles. Verify is used by humans during release; Documentation is consumed by end users post-release. Coupling them to the factory means redeploying the factory to fix a doc layout. Decoupled = independent evolution.

## 4. Right model for the right task

Multi-tier LLM routing from Phase 2 onward:

| Tier | Use for | Examples |
|---|---|---|
| Architect | Complex reasoning, planning, code review | Claude Opus 4.7, GPT-5, Gemini 2.5 Pro |
| Worker | Code generation, doc writing, structured output | Claude Sonnet 4.6, Gemini 2.5 Flash, GPT-5-mini |
| Cheap | Simple classification, formatting, summarization | Claude Haiku 4.5, Gemini Flash, Qwen 3 |
| Logic | Deterministic transforms (no LLM) | Pure code, regex, AST, schema validators |

The router is configurable — admin can override per-task in Phase 2's UI.

## 5. Two-tier user model: Super Admin and User

- **Super Admin** sees every config, every key, every option.
- **User** sees a curated subset (presets, gated features) — protects them from the cognitive overload of full configurability.

This split lets us keep maximum optionality (Principle 1) without overwhelming everyday operators.

## 6. Source of truth is in this repo

Anything that survives a VM rebuild lives in this git repo:
- PMD docs ✅
- Systemd units ✅ (`deploy/`)
- nginx vhosts ✅ (`deploy/`)
- App code ✅ (`factory-dashboard/`, `cognitive-engine/`)
- Env templates (no secrets) ✅ (`configs/`)

Anything NOT in this repo dies on VM rebuild. Audit periodically.

## 7. Secrets never in repo, never in chat

- `.env` files — `.gitignore`'d, never committed.
- API keys — admin UI manages them (Phase 12).
- GitHub PATs — `gh auth login` credential helper, never embedded in `.git/config`.
- For chat: paste tokens directly into terminal prompts, not into chat messages.

This rule has been violated twice in setup. Don't normalize it.
