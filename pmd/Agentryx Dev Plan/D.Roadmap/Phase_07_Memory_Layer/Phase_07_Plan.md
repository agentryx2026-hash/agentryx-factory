# Phase 7 — Memory Layer v1

**One-liner**: Hybrid memory — Obsidian vault (human-curated) + Hermes-patterned session memory (SQLite FTS5 + LLM summarization + optional Honcho). Per Principle 1, evaluate Letta and Graphiti as additional backends in parallel.

**Updated 2026-04-21 (after Phase 2.75 evaluation)**:

Hermes's memory stack (FTS5 session search + LLM summarization across sessions + Honcho dialectic user modeling) is mature. Phase 7 scope is now:

- **Core**: implement the SQLite FTS5 + LLM-summary pattern INSIDE our factory (SQLite file per project, summarization via the Phase 2 router). NOT running full Hermes container for memory.
- **Optional plug-in**: Honcho (if its license/deployment model suits us).
- **Evaluation alongside**: Obsidian vault for human-curated knowledge (different layer — "what humans deliberately record" vs. "what the system passively remembers").

Goal: ship a memory service that cognitive-engine agents can call for "what did we learn about this project in previous sessions?" — answered via FTS5 + summarization.

*(sketch — expanded when phase becomes active)*
