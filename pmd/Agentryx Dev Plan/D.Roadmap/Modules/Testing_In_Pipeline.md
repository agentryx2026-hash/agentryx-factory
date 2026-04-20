# Module — Testing In Pipeline

The factory runs **its own tests** during the dev cycle. Verify portal handles **human verification on top**. Two distinct layers.

## In-pipeline testing (agent-driven)

Owned by Tuvok agent. Runs alongside code generation (Phase 8 — Parallel Artifacts).

| Test type | When | What |
|---|---|---|
| Unit | Continuously during code gen | Per-function correctness, edge cases |
| Integration | After feature complete | Multi-module flows |
| Smoke | Pre-deploy | Critical happy-path coverage |
| Load | Pre-deploy | Throughput at expected concurrency |
| UI | Pre-deploy | Playwright / equivalent — key flows render and accept input |
| E2E | Pre-deploy | Full workflow simulation |

Tuvok generates test code from spec + code; Spock can revise code in response to failures (Torres ⇄ Tuvok ⇄ Data feedback loop already exists in `factory_graph.js`).

## Output

Test reports are artifacts (Phase 6). Pass/fail summary, failing test details, coverage stats. Posted to the Verify portal as part of the build package.

## Cost optimization

Per agent delegation model (see `01_Agent_Delegation_Model.md`):

- Test generation: Sonnet (structured output, well-suited)
- Test execution: pure code (no LLM cost)
- Failure analysis: Sonnet → escalate to Opus only if Sonnet can't resolve

Most test cycles should never invoke an architect-tier model. Hard discipline; tracked in Phase 11 cost dashboard.

## Human verification (Verify portal layer)

After in-pipeline testing passes, the build moves to Verify (Phase 9 — Verification Queue). Humans:

- Review the deployed staging instance
- Mark requirements Pass / Partial / Fail / Deferred
- Upload screenshots, leave comments
- Submit final reviewer reports

Feedback flows back to the factory (see `Verify_Portal_Integration.md` for the boundary contract).

## Parallel testing example

For a typical project, when Spock finishes a code module:

```
                    ┌── Tuvok writes unit tests ──┐
                    │                             │
Spock (code) ───────┼── Tuvok writes integration ─┼── Data reviews ── Crusher final ── O'Brien deploys
                    │                             │
                    └── Doc-User updates guide ───┘
```

All three branches run concurrently. Join at Data review.
