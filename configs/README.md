# configs/

Templates and example configs. **No secrets.** `.env` files containing real keys are `.gitignore`'d at the repo root.

## Planned contents (populated in later phases)

```
configs/
├── .env.example                  # template for top-level env (ROUTER_BACKEND, etc.)
├── factory-dashboard/.env.example
├── cognitive-engine/.env.example
├── paperclip/.env.example
├── openclaw/openclaw.json.template
├── llm-routing.yaml              # per-task model assignment (Phase 2)
├── llm-prices.yaml               # per-model price table (Phase 2)
└── dependencies.md               # external repos this factory depends on (claw-code-parity, paperclip, openclaw)
```

## Loading

Real `.env` files live at `~/Projects/agentryx-factory/factory-dashboard/.env`, `~/.openclaw/.env`, etc. — created by copying from `.example` and filling in real values, never committed.

## Phase 12 (B7 admin module)

Once the admin UI ships, most of these configs move to a Postgres-backed `config_settings` table (per the existing `B7` PMD spec). The `configs/` directory then holds only schema-level templates / migrations, not live values.
