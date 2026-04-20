# Module — Documentation

The factory must produce, alongside code, the full documentation suite required for a published software product. Documentation is its **own track** — not an afterthought, not a separate phase that runs after dev. It runs in parallel with code (Phase 8 — Parallel Artifacts).

## Document types per project

Catalog (will expand — this is a starter list):

| Type | Audience | Format | Owner agent |
|---|---|---|---|
| Brief | Sponsor / executive | 1-pager markdown | Picard (architect) |
| Functional spec | Product team | Markdown + diagrams | Picard / Sisko |
| API reference | Developers (integrators) | OpenAPI + rendered HTML | Tuvok (knows the test surface) |
| User guide | End users | Markdown + screenshots + video links | (new) Doc-User agent |
| Admin guide | Operators | Markdown + runbooks | (new) Doc-Admin agent |
| Reference guide | Power users | Markdown | (new) Doc-Reference agent |
| Training script (written) | Trainers | Structured markdown | Phase 16 |
| Training video script | Voice talent / TTS | SSML / structured | Phase 16 |
| Release notes | All users | Markdown | O'Brien (deploy) |
| Brief catalog | Internal | Index across all docs | Hermes |

## Storage

All docs are **artifacts** (Phase 6 — Artifact-First State). Stored in the project workspace under `agent-workspace/{project_id}/docs/{doc_type}/`. Versioned per build.

## Publishing target

Per Principle 1 — multiple destinations, switchable:

- Static site (mkdocs / docusaurus) hosted on GitHub Pages or VPS
- Custom Doc Portal (Phase TBD — not yet in roadmap)
- Direct embed in Verify portal review packages
- Push to a Notion / Confluence space (admin-configurable)

## Why this is its own module, not a Phase

Documentation cuts across many phases:
- Phase 8 makes it parallel to code generation
- Phase 16 generates training scripts
- Phase 17 generates training videos
- Phase 19 (Customer Portal) consumes docs for end users

Treating it as one Phase would force linear thinking. Instead it's a cross-cutting concern with hooks in multiple phases.
