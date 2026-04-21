# Phase 10 — Courier (External Comms Agent)

**One-liner**: External communications — GitHub PR open / comment, Slack / Discord / Email notifications, status pings. Decouples agent reasoning from external API plumbing.

**Previously named "Hermes"** — renamed 2026-04-21 to avoid collision with the external Hermes Agent framework (Nous Research) evaluated in Phase 2.75.

**Updated 2026-04-21 after Phase 2.75 evaluation (D74)**:

**Courier IS Hermes in gateway mode.** Scope changed from "custom build" to "deploy Hermes in `hermes gateway` mode, configure channels."

Phase 10 implementation (revised):

1. Bring Hermes container back up (same `hermes/docker-compose.yml` from Phase 2.75).
2. Run `hermes gateway --configure` to set up channel bindings:
   - Slack (our internal ops)
   - GitHub (factory opens PRs on generated projects)
   - Email (project delivery notifications)
   - Discord / Telegram / WhatsApp / Signal — optional, per user's preference
3. Factory events (PR open, deployment done, verify feedback, budget_exceeded) routed:
   - `factory-admin` service → HTTP POST to `hermes gateway` endpoint → appropriate channel
4. Paperclip dispatches job completion events to Hermes's webhook.

**Saves ~2 weeks** vs custom-building 6 messaging integrations.

## Config needed (Phase 10 execution time)

- GitHub App install (for PR ops) — one-time user setup
- Slack Bot OAuth token — one-time user setup
- SMTP or SendGrid for email — one-time user setup
- Hermes gateway mode config in `hermes/data/` (persistent)

## Events taxonomy (what Courier sends)

| Event | Channel | Recipient |
|---|---|---|
| `project.pr_opened` | GitHub comment on PR | project maintainers |
| `project.deployment_ready` | Slack #factory-ops | operator |
| `verify.feedback_received` | Slack #factory-ops | Super Admin |
| `cost.budget_exceeded` | Slack #factory-ops + email | Super Admin |
| `agent.error_rate_spike` | Slack #factory-ops | operator |
| `project.delivery_ready` | Email | customer (Phase 19) |

*(sketch — expanded when phase becomes active)*
