# Phase 1.5 — Lessons Learned

Phase closed: 2026-04-21. Duration: single session.

## What surprised us

1. **Docker-compose volume preservation via pinned `name:` worked exactly as intended.** No volume rebuild, no data loss, no volume migration dance. `name: pixel-factory-ui` at the top of compose.yml was a 1-line change that made the rest of the rename trivial. This pattern belongs in our "when renaming a docker-compose directory" runbook.

2. **Symlinks-at-old-path gave us two-phase migration for free.** By creating `~/Projects/pixel-factory-ui → agentryx-factory/factory-dashboard` as a symlink at the same time as the `mv`, every hardcoded reference to the old path kept working. That let me update systemd + telemetry.mjs paths AFTER the services restarted — not as a simultaneous atomic change. Way safer.

3. **factory-dashboard had a nested `.git/` I didn't know about.** The fork of `Agentryx-Dev-Factory` carried its own git history INSIDE pixel-factory-ui. When I tried to `git add` the moved directory, git noticed and warned about "embedded git repository". If I'd missed the warning, the mono-repo would have silently stored just a SHA reference (sub-module-ish) and lost tracking of contents. Caught early; removed the nested .git.

4. **nginx `/paperclip/` location had been silently missing for ~20 hours before I noticed** — and it wasn't user-reported until the sidebar link clicked into the wrong view. Quiet failures like this are the worst: the system looks "up" (all services green) but one specific path was routing to the wrong upstream. Better smoke tests = earlier detection; added `/paperclip/api/health` to the Phase 1 restore.sh runbook sanity checks.

5. **GitHub repo rename is nearly free.** `gh repo rename` + `git remote set-url` + auto-redirect of old URL. No clone rebuild needed, no CI pipeline updates needed in our case because we have no CI yet. Total: 30 seconds of my time plus 1 git push to confirm. Worth doing early in any project when brand/name shifts.

## What to do differently

1. **Always `find ~/Projects/<dir> -name '.git' -type d` BEFORE moving a directory into a mono-repo.** Nested git repos would have been a silent data-integrity issue. This is the kind of check that goes in a pre-flight script.

2. **Pre-flight scripts are worth writing.** I did mine ad-hoc with `grep -nRE`. For Phase 1.5-B the checks were: active services, volume names, hardcoded paths, nested .git dirs. A `deploy/migrations/pre-flight.sh` would be ~30 lines of bash and would codify these for future VM-shuffles.

3. **Monitor tool is great for "wait until condition, emit when met"**, less great for noise suppression when condition takes long. My paperclip-ready-probe fired 5+ "not ready yet" lines before "READY". Next time: use `grep --line-buffered` to filter so only the READY line emits, OR use polling with run_in_background + one final probe.

## What feeds next phases

- **Phase 2.75 (Hermes Evaluation)** can now install Hermes cleanly at `~/Projects/agentryx-dev-factory/hermes/` (or `~/Projects/hermes/` and symlink in for consistency with paperclip). Docker-isolated install is still the plan per Phase 2.75 D62.

- **Phase 3 (Genovi intake)** can add new cognitive-engine nodes directly in `agentryx-factory/cognitive-engine/` — version-controlled immediately, no snapshot dance.

- **Phase 12 (Full B7 admin module)** pattern established here: service lives in `agentryx-factory/server/`, systemd unit in `deploy/systemd/`, nginx route in `deploy/nginx/`. Future admin surfaces follow same layout.

## Stats

- **4 commits** during Phase 1.5 (`2ba5ec7`, `8b6ae73`, `38602e7`, + close)
- **~18 hardcoded paths** updated (telemetry.mjs spawn, 3 systemd units, a few scripts)
- **0 data loss** (volumes preserved via pinned compose name)
- **0 downtime** on public URLs > ~30 seconds (only paperclip warmup)
- **2 snapshot directories removed** (`cognitive-engine-snapshot/`, `factory-dashboard-snapshot/`) — now obsolete
- **1 nested .git repo** caught before it caused tracking loss
- **1 silently-missing nginx location** fixed (`/paperclip/`) — sanity check gap
- **3 forks kept as separate repos** (`paperclip`, `claw-code-parity`, `openclaw`) per D6 — upstream sync path preserved

## Phase 1.5 exit criteria — all met

- ✅ Both URLs work as before (no functional regression)
- ✅ All postgres data preserved (llm_calls, provider_keys, key_audit_log queryable)
- ✅ `git ls-files` shows `factory-dashboard/` and `cognitive-engine/` populated in monorepo
- ✅ Old paths `~/Projects/pixel-factory-ui` and `~/Projects/cognitive-engine` are symlinks
- ✅ Snapshot dirs removed from monorepo
- ✅ GitHub repo renamed, old URL redirects
- ✅ Tool links visible in dashboard sidebar
- ✅ Paperclip UI enabled server-side (full public UI deferred to subdomain follow-up)
