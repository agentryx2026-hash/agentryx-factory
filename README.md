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
| `factory-dashboard/` | *(Phase 1.5 import)* Vite + React dashboard. Currently at `~/Projects/pixel-factory-ui/`. |
| `cognitive-engine/` | *(Phase 1.5 import)* LangGraph runner. Currently at `~/Projects/cognitive-engine/`. |

## External components (separate repos, by design)

| Component | Repo | Why separate |
|---|---|---|
| `claw-code-parity` | `microaistudio/claw-code-parity` | Fork of `instructkr/claw-code` — keep upstream sync path |
| `paperclip` | upstream fork | Same — fork of upstream |
| `openclaw` | upstream fork | Same |
| Verify portal | *TBD* | Standalone application; this factory **integrates** with it |

## Current phase

**Phase 1 — Restore + Observe**.

See [pmd/Agentryx Dev Plan/D.Roadmap/Phase_01_Restore_and_Observe/Phase_01_Status.md](pmd/Agentryx%20Dev%20Plan/D.Roadmap/Phase_01_Restore_and_Observe/Phase_01_Status.md) for live status.

## Authoritative source

This repository is the **single source of truth** for the Agentryx Dev Factory codebase, configuration, and plan. The legacy `microaistudio/Agentryx-Dev-Factory` repo has been superseded.
