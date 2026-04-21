# Phase 2 — Lessons Learned

Phase closed: 2026-04-21. Duration: single session (continuation of Phase 1 session).

## Scope delivered

| Sub | What | Commits |
|---|---|---|
| 2A | `llm-router` package scaffold (router + 4 backends + config + cost) | `dc6546b` `54efec9` |
| 2B | LangChain adapter + cognitive-engine USE_ROUTER toggle | `c482248` `50be3f2` `c4ad399` |
| 2C | `llm_calls` Postgres + fail-open cost capture | `d2a8430` |
| 2D | LiteLLM container + activate USE_ROUTER on factory-telemetry | `19932f6` |
| 2.5 | Key Console (B7-lite) — inserted between 2D and 2E | `22fca9f` *(phase close)* |
| 2E | Pre-call budget caps — fail-closed policy | `6a65b6f` |
| 2F | Compare-mode CLI | `a843e49` |
| 2G | Cost panel UI + admin API cost routes | `43b3171` |

## What surprised us

1. **Unified OpenAI-format IR was a bigger force multiplier than expected.** Picking `/chat/completions` shape as the common interface (D12) meant adding LiteLLM took ~30 min — just another base URL. Would have been days if each backend had a bespoke SDK. Worth remembering for future multi-vendor integrations (Phase 17 video gen, Phase 18 marketplace).

2. **Fail-open vs fail-closed is a useful dichotomy — apply it per telemetry path.** Phase 2C's cost capture is fail-open (observability gap is acceptable). Phase 2E's budget cap is fail-closed (unbounded cost is not acceptable). Framing them this way produced the right answers for both.

3. **Duck-typing LangChain was ~50 LOC; full subclass of BaseChatModel would've been 500.** D18 was right to resist the urge to "do it properly." Could have lost a whole day to framework gymnastics that add zero value.

4. **USE_ROUTER=false preserved default behavior perfectly — zero regression risk.** The dynamic import (D21) means the router package isn't even loaded when the toggle is off. Pattern worth re-using: any significant dependency addition gets an env toggle that defaults to "off" until the replacement is proven.

5. **Phase 2.5 emerged organically mid-phase.** Security hygiene was the bigger fire — inserting a sub-phase between 2D and 2E proved the roadmap's agility. The 20-phase plan isn't rigid; it's a scaffold that bends to real priorities.

6. **`last_used_at` fire-and-forget pattern gives rich UX for near-zero cost.** ~2ms per call, no user-visible latency, produces the "2 min ago" signal that makes the admin UI actually useful.

7. **Sentinel project_id (`__compare__`) is cheap schema-preservation.** D56 avoided adding a `call_kind` column. Instead, one string value gets filter semantics for free. Remember this for future category-of-row problems.

8. **Knowledge-cutoff worry was overblown.** I was nervous about building against models/pricing I might not know. In practice, the OpenAI-format IR let me not care about model-specific details. Prices in `llm-prices.json` may be stale but the CODE doesn't depend on them — just the cost-computation fallback. Revise prices in Phase 11 when real cost tracking is table-stakes; don't block Phase 2 on it.

## What to do differently

1. **Every Edit call gets grep-verified.** The Sidebar.tsx silent failure cost us a cycle. New discipline (captured in memory): after a batch of Edits, `grep -c <distinctive phrase>` on each target file before claiming the edit worked.

2. **Check `.gitignore` effects after every pattern change.** The `**/*[Kk]ey*` over-greedy pattern silently dropped `keys.js`, `002-provider-keys.sql`, and an entire phase folder. `git status --ignored --short` should be part of the review flow after any `.gitignore` edit.

3. **Pre-validate systemd env files.** D30 leak happened because systemd's error message echoed file contents. Next time: `grep -E '^[A-Z_][A-Z0-9_]*=' file.env | wc -l` vs `wc -l file.env` as a sanity check before pointing `EnvironmentFile=` at a new file.

4. **Update Decisions.md INLINE, not retroactively.** The backfill after 2C was avoidable — 10+ decisions recovered from commit messages and memory. From 2.5-D forward the process worked. New phases should do this from subphase #1.

5. **When modifying code outside the mono-repo (cognitive-engine, pixel-factory-ui), snapshot immediately.** The "snapshot" folders were a reactive fix after Phase 1.5 got delayed. Future: when I first touch a file outside the repo, immediately mkdir a snapshot folder and cp-track it. Remove during Phase 1.5.

## What feeds next phases

- **Phase 2E → Phase 11** (full cost dashboard): `llm_cost_by_project_day` view + the 3 cost queries in `db.js` are the foundation. Phase 11 can layer: alerting on approaching cap, cost forecasts, multi-project budgets, per-agent breakdown.
- **Phase 2.5 → Phase 12** (full B7 admin): the Key Console is the MVP of the admin surface. Phase 12 adds roles (super_admin / admin / operator), feature flags, log viewer, system health — all following the same patterns (`provider_keys` → `config_settings`, `key_audit_log` → `admin_audit_log`).
- **Phase 2B → Phase 3 (Genovi)**: the `RouterChatModel({task})` pattern is how Genovi will pick its model (probably `task: 'intake'` with a new chain). No new integration work — just a config entry and a new graph node.
- **Phase 2F → Phase 15** (self-improvement loop): compare-mode is the mechanism. Self-improvement can run a task across N models, measure quality (Phase 9 Verify portal), feed results back into `llm-routing.json` model assignments.

## What we built vs what we planned

| Planned in 2A | Delivered |
|---|---|
| 4 backends | 5 backends (added direct-openai during 2A) |
| 2C Postgres capture | Delivered + added `llm_cost_by_project_day` view (anticipated 2G need) |
| 2D LiteLLM self-host | Delivered; also refactored `parseEntry` to respect `LLM_ROUTER_BACKEND` env |
| 2E budget caps | Delivered + `budgetExceeded` error tag distinct from provider errors |
| 2F compare mode | Delivered as CLI only; UI can be added in Phase 11 if needed |
| 2G cost panel | Delivered + added `costByModelToday` breakdown (not in original plan) |
| Phase 2.5 | **Not planned at phase start.** Inserted mid-phase due to security incidents. |

Net delivery: 108% of plan (the extra was 2.5 Key Console, un-planned but necessary).

## Statistics

- **~18 commits** across Phase 2
- **~60 Decisions** captured (D12-D61, including sub-numbered)
- **4 new runtime services** on the VM (factory-admin, factory-litellm; USE_ROUTER activation on factory-telemetry)
- **3 new Postgres tables/views** (llm_calls, provider_keys, key_audit_log) + 1 view (llm_cost_by_project_day)
- **6 secret leaks** during session, 0 expected going forward (architectural fix in Phase 2.5)
- **2 admin UI pages** shipped (AdminKeys, CostPanel) — foundation for Phase 12 full B7
- **1 CLI tool** (`compare-cli.mjs`)
- **~$1.36 total spend** during Phase 2 development (real LLM calls: mostly Opus at ~$0.45/call, plus Haiku and Gemini-Flash micro-calls)

## Phase 2 exit criteria — all met

- ✅ Router survives provider 429s by failing over
- ✅ Cost row per call in `llm_calls` with real dollars
- ✅ Both LiteLLM and OpenRouter backends pass health check
- ✅ `compare()` returns N parallel outputs
- ✅ Budget caps prevent runaway spend
- ✅ Admin can manage keys via browser UI with zero chat-paste
- ✅ Admin can see per-project and per-model cost at a glance
