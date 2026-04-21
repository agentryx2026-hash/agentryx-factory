#!/usr/bin/env bash
# Starts Hermes with provider keys fetched LIVE from the admin DB
# (Phase 2.5 encrypted store), not from a stale .env file.
#
# Use this instead of `docker compose up -d` whenever provider keys
# were rotated via the Admin Key Console.

set -euo pipefail
cd "$(dirname "$0")"

get_key() {
  cd ..
  node -e "
    import('./llm-router/src/keys.js').then(async m => {
      const k = await m.getKey('$1');
      if (k) process.stdout.write(k);
    });
  " 2>/dev/null
  cd - >/dev/null
}

OR_KEY=$(get_key openrouter)
AN_KEY=$(get_key anthropic)

if [ -z "$OR_KEY" ]; then
  echo "ERR: no openrouter key in admin DB. Set one via https://dev-hub.agentryx.dev/ → 🔑 API Keys." >&2
  exit 1
fi

echo "ℹ️  Starting Hermes with OpenRouter key from admin DB (len=${#OR_KEY})"
echo "ℹ️  Anthropic key from admin DB: $([ -n "$AN_KEY" ] && echo yes || echo no)"

OPENROUTER_API_KEY="$OR_KEY" \
  ANTHROPIC_API_KEY="$AN_KEY" \
  docker compose up -d

# Scrub from our shell (doesn't remove from container env — intentional)
unset OR_KEY AN_KEY
