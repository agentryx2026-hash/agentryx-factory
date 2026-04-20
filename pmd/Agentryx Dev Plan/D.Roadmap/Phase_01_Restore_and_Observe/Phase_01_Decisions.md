# Phase 1 — Decisions Log

Decisions made during this phase. Each entry: **what / why / alternatives rejected**.

## D1 — Use systemd, not pm2

**What**: All dev-hub services run as systemd units, not under pm2 process manager.

**Why**: Already on the box; no extra runtime; survives reboot without `pm2 startup` ceremony; logs via `journalctl`; simple `systemctl restart`. pm2 buys nothing here for our scale.

**Rejected**: pm2 (extra dependency, dashboard not needed at this stage).

## D2 — HTTP Basic Auth for claw-code at nginx layer, not ttyd

**What**: Auth is enforced by nginx (`auth_basic`) before requests reach ttyd. Single htpasswd file.

**Why**: Stops unauthenticated requests at the edge; ttyd config stays simple; credentials managed in one place.

**Rejected**:
- ttyd's own `-c user:pass` (couples auth to process restart)
- OAuth proxy (overkill for one user)

## D3 — Run ttyd as `subhash.thakur.india`, not root

**What**: Add `User=` and `Group=` to ttyd systemd unit.

**Why**: Internet-exposed shell as root is unacceptable security posture even for a dev box.

## D4 — Use existing Verify portal repo, integrate not rebuild

**What**: The Verify portal is a separate application (`verify-stg.agentryx.dev`). The factory will integrate via webhooks/API. No rebuild.

**Why**: Already in use in production for one project (HireStream). Generification + integration is cheaper than rewriting.

## D5 — Fresh GitHub repo, archive the old (mono-repo strategy)

**What**: New `microaistudio/agentryx-factory` repo (under `agentryx2026-hash` account, dedicated to factory). Old `microaistudio/Agentryx-Dev-Factory` archived.

**Why**: Old repos were "save-as-I-go" snapshots, fragmented across 4 repos. Clean structure aligned to the roadmap from commit #1 sets the foundation. Old history preserved as archive (not deleted).

**Rejected**:
- Use existing `Agentryx-Dev-Factory` repo (inherits messy fragmented history)
- Multi-repo split (more `.gitignore` and CI surface, no benefit at this stage)

## D6 — Mono-repo ≠ subsume forks

**What**: `claw-code-parity`, `paperclip`, `openclaw` stay as their own forked repos. Only factory-original code (cognitive-engine, factory-dashboard, pmd, deploy, configs) lives in the mono-repo.

**Why**: Forks need upstream sync. Putting them in the mono-repo breaks that workflow.

## D7 — PMD lives at `agentryx-factory/pmd/`; `~/Projects/PMD` becomes a symlink

**What**: Physical move of PMD into the new repo. Backward-compat symlink at the old path.

**Why**: Single source of truth (the repo). Symlink prevents breakage of any references to old path.

## D8 — Phase 1.5 splits rename + monorepo migration off from Phase 1

**What**: Renaming `pixel-factory-ui` → `factory-dashboard` and physically moving working dirs into the mono-repo is its own Phase 1.5, executed AFTER Phase 1 restore lands.

**Why**: docker-compose volume names are derived from project directory name. Renaming the dir would orphan existing data volumes (`pixel-factory-ui_postgres-data` etc.). Needs careful handling — must not blend with restore.
