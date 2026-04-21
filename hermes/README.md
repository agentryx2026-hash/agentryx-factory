# hermes/

Phase 2.75 — Docker-isolated Hermes Agent evaluation instance.

**Status**: evaluation. Not adopted into the factory pipeline yet. See `pmd/Agentryx Dev Plan/D.Roadmap/Phase_2.75_Hermes_Evaluation/` for the decision-making track.

## Layout

```
hermes/
├── README.md           (this)
├── docker-compose.yml  (nousresearch/hermes-agent:latest, isolated stack)
└── data/               (HERMES_HOME — mounted as /opt/data inside container)
                        Gitignored. Contains hermes state, skills, memory.
```

## Run

```bash
cd agentryx-factory/hermes
docker compose up -d
docker compose logs -f hermes         # watch startup
docker exec -it factory-hermes hermes setup   # one-time config wizard
```

## Configuration

Hermes is configured via its own CLI (`hermes setup`) rather than env vars for most settings. The Docker env passes provider keys from our factory `.env`:

- `OPENROUTER_API_KEY` — primary (matches our factory router default)
- `ANTHROPIC_API_KEY` — fallback direct

Hermes will use whichever you select in `hermes setup`.

## Isolation from the factory

- Own docker-compose project `hermes` — no interference with factory-postgres / n8n / etc.
- Non-root user (UID 1001, matching host `subhash.thakur.india` for file ownership).
- Port mapping reveals whatever Hermes gateway chooses (discovered on first run).
- **Teardown is clean**: `docker compose down -v && rm -rf data/` — fully reverted.

## Evaluation track

See Phase 2.75 docs for benchmark tasks and decision matrix. This directory is the isolated test-bed; adoption or abandonment after the evaluation will be a separate commit (either integrate into main factory or `rm -rf hermes/` to remove).
