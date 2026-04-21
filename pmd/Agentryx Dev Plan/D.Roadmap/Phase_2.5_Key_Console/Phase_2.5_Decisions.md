# Phase 2.5 — Decisions Log

## D33 — Phase 2.5 inserted between 2D and 2E (security urgency)

**What**: Build the API Key Console BEFORE finishing Phase 2 (specifically before 2E budget caps).

**Why**: 6 secret leaks in this session (Anthropic key in chat, partial PAT via `gh auth status`, full keys via systemd journal error message, etc.). Each rotation cycle so far has involved another chat-paste step. Console eliminates the chat-paste pattern: keys go browser → encrypted DB, never through chat.

Budget caps (2E) protect against runaway spend; the key console protects against credential exfiltration. The latter is the bigger immediate concern given the leak history.

## D34 — AES-256-GCM for at-rest encryption (not KMS yet)

**What**: API keys stored in `provider_keys.ciphertext` encrypted with AES-256-GCM. Master key is 32 random bytes loaded from `~/.config/factory-master-key`.

**Why**:
- AEAD (Authenticated Encryption with Associated Data) catches tampering — important for a multi-tenant future.
- Standard, fast, in Node's `crypto` module — zero new deps.
- 32-byte key + 12-byte IV per row + 16-byte auth tag = textbook NIST SP 800-38D.

**Tradeoff**: Master key is a flat file on disk. If the VM is compromised, attacker gets master + ciphertext = same exposure as plaintext env vars. So this isn't "true" defense-in-depth — but it adds a meaningful layer against casual disk reads (e.g. an `rsync` of `~/Projects/` to a backup).

**v1.0 upgrade path**: Move master to GCP Secret Manager (or HashiCorp Vault). The schema and code don't change — only how the master is fetched.

## D35 — Master key location: `~/.config/factory-master-key` (chmod 600)

**What**: 32 random bytes, base64-encoded, in a flat file at `~/.config/factory-master-key`. Created by `deploy/restore.sh` on first run if missing. Owner: `subhash.thakur.india`. Mode: 0600.

**Why**:
- Same pattern we used for `agentryx-factory-token` — proven, simple.
- Outside any project directory → never accidentally committed.
- Restore.sh generates it fresh on a new VM if missing → restore.sh remains idempotent and "one command on a fresh box."

**Risk**: VM disk snapshot includes this file. Anyone who can read the snapshot can decrypt the keys DB. Acceptable at v0.0.1 R&D where snapshots stay in our GCP project. v1.0: snapshot encryption + KMS-managed master.

## D36 — Same htpasswd as claw-code for the admin UI

**What**: Phase 2.5-B and 2.5-C will guard `/admin/*` paths with the existing `/etc/nginx/.htpasswd-claw-code` file (same `subhash` user used for claw-code).

**Why**:
- Single credential to rotate later.
- Avoids designing a "real" auth system — that's Phase 12 (full B7) scope.
- Per-route auth blocks at nginx layer means downstream services don't need to know about auth at all.

## D37 — Provider catalog in `configs/providers.json` (declarative)

**What**: A static JSON file lists every supported provider, with display label, expected key prefix, and optional test endpoint:

```json
{
  "anthropic":  { "label": "Anthropic", "key_prefix": "sk-ant-", "test_endpoint": "https://api.anthropic.com/v1/models" },
  "openrouter": { "label": "OpenRouter", "key_prefix": "sk-or-v1-", "test_endpoint": "https://openrouter.ai/api/v1/models" },
  ...
}
```

**Why**: Adding a new provider = one row in JSON + (eventually) one `model_list` entry in LiteLLM config. No code changes. Decouples "what providers exist" (config) from "how we call them" (router code).

The prefix lets us validate user input before storing — catches "I pasted the wrong type of key" mistakes.

## D38 — Backend-first rollout (CLI test before HTTP API)

**What**: Phase 2.5-A ships a Node-CLI testable module (`keys.js` exports `getKey/setKey/listKeys/toggleKey/deleteKey`). 2.5-B wraps it in HTTP endpoints. 2.5-C wraps that in a React UI.

**Why**: Each layer is independently testable. If the HTTP API misbehaves we can verify the CRUD layer is fine via Node CLI. If the UI misbehaves we can verify the API via curl. Faster bisection on bugs.

## D39 — Audit log in same DB, separate table

**What**: `key_audit_log` table records every change (create/update/toggle/delete) with actor + provider + JSONB details + timestamp.

**Why**: Complements the encryption — you can see WHEN keys changed even if you can't see WHAT they changed to (ciphertext-only). Combined with nginx access logs (which see the auth user), gives full forensic chain.

**Privacy**: The `details` JSONB never contains the actual key value — only metadata (e.g. `{"prefix":"sk-ant","length":108}`). So the audit log is safe to read without decryption keys.

## D40 — `last_used_at` column updated by router, not by API

**What**: Router (Phase 2.5-D) updates `provider_keys.last_used_at` on every call that uses a key. Admin UI just reads it.

**Why**: True usage signal — if a key shows "last used: 3 weeks ago" with `enabled=true`, admin knows it's stale and can clean up. Tells operational story without needing a separate analytics layer.

**Performance**: One UPDATE per LLM call adds <2ms; non-blocking via fire-and-forget pattern (same as `insertCallRow`).
