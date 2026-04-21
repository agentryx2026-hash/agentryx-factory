# Phase 2.5 — API Key Console (B7-lite)

**Started**: 2026-04-21
**Why inserted before Phase 2E**: 6 secret leaks in this session (mostly via my own mistakes interacting with chat-pasted secrets). The Console eliminates the chat-paste pattern entirely — keys go directly browser → encrypted DB. Until this exists, every rotation cycle has fresh leak risk.

## Scope (intentionally narrow)

This is **B7-lite** — only the API key feature from the full B7 admin spec. Roles, feature flags, log viewer, rate limits, etc. all stay in **Phase 12** (full B7 implementation). The full B7 module supersedes this when it lands.

## What ships

```
┌─────────────────────────────────────────────────────────────┐
│  https://dev-hub.agentryx.dev/admin/keys                    │
│  HTTP basic auth (subhash creds — same as claw-code)        │
├─────────────────────────────────────────────────────────────┤
│  Provider     Key (masked)    Enabled   Last Used   Actions │
│  ──────────────────────────────────────────────────────────  │
│  anthropic    sk-ant...A4b6   [ON]      2 min ago    Edit ⌫ │
│  openrouter   sk-or-...x7tL   [ON]      30 sec ago   Edit ⌫ │
│  openai       —               [OFF]     never        Add    │
│  gemini       —               [OFF]     never        Add    │
│  deepseek     —               [OFF]     never        Add    │
│  qwen         —               [OFF]     never        Add    │
│  mistral      —               [OFF]     never        Add    │
└─────────────────────────────────────────────────────────────┘
```

## Subphases

### 2.5-A — Backend (this subphase)

| Deliverable | Path | Status |
|---|---|---|
| Migration: `provider_keys` + `key_audit_log` tables | `llm-router/migrations/002-provider-keys.sql` | in progress |
| Master key (32 random bytes, chmod 600) | `~/.config/factory-master-key` (NOT in repo, NOT in chat) | in progress |
| Encrypt/decrypt + CRUD module | `llm-router/src/keys.js` | in progress |
| Provider catalog (declarative list of supported providers) | `configs/providers.json` | in progress |
| Smoke test via Node CLI | n/a | in progress |

### 2.5-B — HTTP Admin API

| Deliverable | Path |
|---|---|
| New service `factory-admin` on port 4402 | `agentryx-factory/server/admin-keys.mjs` (new) |
| Routes: `GET /api/admin/keys`, `POST /api/admin/keys/:provider`, `PATCH /api/admin/keys/:provider/toggle`, `DELETE /api/admin/keys/:provider` | same |
| Systemd unit | `deploy/systemd/factory-admin.service` |
| Nginx route `/admin/api/keys/*` (proxied) | extend `dev-hub.agentryx.dev` vhost |

### 2.5-C — UI Page

| Deliverable | Path |
|---|---|
| React page component | `pixel-factory-ui/src/components/AdminKeys.tsx` (new) |
| Sidebar nav entry "🔑 Keys" | `pixel-factory-ui/src/components/Sidebar.tsx` |
| Browser route `/admin/keys` | Vite app router |
| Nginx route `/admin/keys` (page itself, separate from `/admin/api/keys/*`) | nginx vhost — basic auth gated |

### 2.5-D — Router cutover

`llm-router/src/keys.js` (Phase 2.5-A) provides `getKey(provider)`. Modify `backends.js` to call this instead of `process.env[<NAME>_API_KEY]` directly. Env-var path stays as fallback for bootstrap (when DB has no key yet).

### 2.5-E — User rotates leaked keys

After 2.5-D ships:
1. Open https://dev-hub.agentryx.dev/admin/keys
2. Rotate Anthropic key at https://console.anthropic.com/settings/keys → enter new key in admin UI
3. Same for OpenRouter
4. Old keys revoked; never enter chat again.

## Success criteria

- All 4 subphases complete
- Old leaked keys revoked + new keys live in encrypted DB
- Router pulls from DB on next call (verified via `last_used_at` updating)
- Audit log shows the rotation events
- No keys in `.env` files anymore (`.env` becomes optional bootstrap-only)
