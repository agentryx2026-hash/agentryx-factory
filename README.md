# Agentryx Dev Factory

Multi-agent software development factory.

**Status**: v0.0.1 — R&D / experimentation phase.

## Vision

Drop SRS / FRS / PRD documents → factory produces production-ready software with code, tests, docs, training materials, and a verification portal for human review.

10+ named agents work in coordinated pipeline (Picard → Sisko → Troi → Jane → Spock → Torres ⇄ Tuvok ⇄ Data → Crusher → O'Brien) using mixed LLM tiers (free / paid / local) to optimize cost and quality.

## Read first

[pmd/Agentryx Dev Plan/D.Roadmap/README.md](pmd/Agentryx%20Dev%20Plan/D.Roadmap/README.md) — the master roadmap. 20 phases, agile, comparison-first. **Open this in any new session before doing anything.**

## Repository structure

| Path | Purpose |
|---|---|
| `pmd/` | Project Management Documents — vision, roadmap, standards, agent specs |
| `pmd/Agentryx Dev Plan/D.Roadmap/` | The 20-phase roadmap (and where status / decisions / lessons live per phase) |
| `deploy/` | Systemd units, nginx vhosts, restore.sh — runtime config versioned here, symlinked into `/etc/` |
| `configs/` | Templates of `.env`, `openclaw.json`, etc. **No secrets.** |
| `docs/` | Runbooks, ops guides, troubleshooting |
| `factory-dashboard/` | Vite + React dashboard (imported into monorepo in Phase 1.5). |
| `cognitive-engine/` | LangGraph runner + Genovi (Phase 3) + MCP tool plane (Phase 5-A) + artifact store (Phase 6-A). |
| `llm-router/` | Multi-provider LLM router with fallback chains + cost capture (Phase 2). |
| `hermes/` | Nous Research Hermes Agent (evaluated Phase 2.75, hybrid adoption for Courier/skills). |
| `server/` | Admin API (Key Console backend, Phase 2.5). |

## External components (separate repos, by design)

| Component | Repo | Why separate |
|---|---|---|
| `claw-code-parity` | `microaistudio/claw-code-parity` | Fork of `instructkr/claw-code` — keep upstream sync path |
| `paperclip` | upstream fork | Same — fork of upstream |
| `openclaw` | upstream fork | Same |
| Verify portal | *TBD* | Standalone application; this factory **integrates** with it |

## Current progress

As of 2026-04-21:

| Band | Closed phases | In progress | Deferred |
|---|---|---|---|
| Foundation | 0, 1, 1.5, 2, 2.5, 2.75, 3, 4, 5-A, 6-A | Phase 7 (Memory Layer) next | 5-B, 6-B (need OpenRouter credit for E2E) |

Phase tags on main (rollback anchors): `phase-0-baseline`, `phase-1-closed`, `phase-1.5-closed`, `phase-2-closed`, `phase-2.5-closed`, `phase-2.75-closed`, `phase-3-closed`, `phase-4-closed`, `phase-5a-closed`, `phase-6a-closed`.

See [pmd/Agentryx Dev Plan/D.Roadmap/README.md](pmd/Agentryx%20Dev%20Plan/D.Roadmap/README.md) for the full roadmap and per-phase status.

## Git workflow

All phases from 5-A onwards ship via PR flow (branch → push → `gh pr create` → squash-merge → tag as `phase-<n>-closed`). Never direct-push to `main`. See roadmap README's "Git workflow" section for the full sequence.

## Authoritative source

This repository is the **single source of truth** for the Agentryx Dev Factory codebase, configuration, and plan. The legacy `microaistudio/Agentryx-Dev-Factory` repo has been superseded.
