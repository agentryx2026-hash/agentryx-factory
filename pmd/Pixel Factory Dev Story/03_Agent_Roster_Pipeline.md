# 03 — Agent Roster & Pipeline

---

## The 10-Agent Crew

### Department 1: INTAKE (Pre-Dev)

| Agent | Character | Series | Role | Model | Speed |
|-------|-----------|--------|------|-------|-------|
| **Picard** | Jean-Luc Picard | TNG | Solution Architect | Gemini 3.1 Pro | Deliberate |
| **Sisko** | Benjamin Sisko | DS9 | Project Planner | Gemini 3.1 Pro | Deliberate |
| **Troi** | Deanna Troi | TNG | Enhancement Analyst (110%) | Gemini 3.1 Pro | Deliberate |

**Picard** — Takes raw customer documents (SRS, FRS, TOR) and converts them into a clean Solution Brief (A1) and Solution Architecture (A2). The captain who sees through chaos to clarity.

**Sisko** — Takes Picard's design and breaks it into buildable modules (A3), development phases (A4), and detailed per-phase PRDs (A5). The commander who builds the battle plan.

**Troi** — Analyzes the scope and identifies quick wins, AI enhancement opportunities, and the extra 10% that makes deliveries exceptional (B4, B6). The empath who senses what the customer really needs.

---

### Department 2: DEV FLOOR (Build)

| Agent | Character | Series | Role | Model | Speed |
|-------|-----------|--------|------|-------|-------|
| **Jane** | Kathryn Janeway | VOY | PM / Triage | Gemini 2.5 Flash | Fast |
| **Spock** | Spock | SNW | Auto-Research | Gemini 3.1 Pro | Deliberate |
| **Torres** | B'Elanna Torres | VOY | Junior Dev / Code Writer | Gemini 3.1 Pro | Deliberate |
| **Data** | Data | TNG | Sr. Architect / Code Review | Gemini 3.1 Pro | Deliberate |

**Jane** — Receives module tasks from the PMD plan and creates precise, structured specifications for the coding pipeline. Fast triage, fast routing.

**Spock** — Researches the best libraries, patterns, and approaches for each module. Produces a research dossier with version numbers and pitfall warnings.

**Torres** — The coder. Takes Spock's research + Jane's spec and writes production-quality source files. Iterates on Tuvok's test feedback when code fails.

**Data** — Senoir architect. Reviews Torres's code for patterns, scalability, naming, and structural integrity. Returns APPROVED or sends back with specific issues.

---

### Department 3: QA + SHIP DECK (Test, Document, Deploy)

| Agent | Character | Series | Role | Model | Speed |
|-------|-----------|--------|------|-------|-------|
| **Tuvok** | Tuvok | VOY | QA Fortress Commander | Gemini 3.1 Pro | Deliberate |
| **Crusher** | Beverly Crusher | TNG | Documentation & Training | Gemini 2.5 Flash | Fast |
| **O'Brien** | Miles O'Brien | DS9 | SRE / Deploy / Package | Gemini 2.5 Flash | Fast |

**Tuvok** — Writes test files IN PARALLEL with Torres's code. Runs unit tests, integration tests, security scans. If tests fail, sends back to Torres with exact error context. Max 3 self-healing loops before flagging human.

**Crusher** — Generates all documentation: API Reference (B1), Developer Guide (B2), Training Materials (B5). Works from finished code + PMD specs.

**O'Brien** — The closer. Commits to git, generates Dockerfile, creates `.zip` package, deploys live preview, generates the Factory Report (B7).

---

## Pipeline Flow

```
STAGE 1: INTAKE
═══════════════
Customer drops raw document
        │
   ┌────▼────┐
   │ PICARD  │ → A1_Solution_Brief.md
   │         │ → A2_Solution_Architecture.md
   └────┬────┘
        │
   ┌────▼────┐
   │  SISKO  │ → A3_Module_Breakdown.md
   │         │ → A4_Dev_Plan_Phasing.md
   │         │ → A5_PRD_Phase{N}.md (one per phase)
   └────┬────┘
        │
   ┌────▼────┐
   │  TROI   │ → A6_Acceptance_Criteria (refined)
   │         │ → B4_AI_Enhancement_Report.md
   │         │ → B6_Quick_Wins_110.md
   └────┬────┘
        │
 ═══ HUMAN GATE (optional): Review PMD before dev starts ═══
        │

STAGE 2: DEV (repeats for each phase)
══════════════════════════════════════
   ┌────▼────┐
   │  JANE   │  Triage phase modules into task specs
   └────┬────┘
        │
   ┌────▼────┐
   │  SPOCK  │  Research best patterns + libraries
   └────┬────┘
        │
   ┌────▼────┬──────────┐
   │ TORRES  │  TUVOK   │  Code + Tests built IN PARALLEL
   │ (code)  │  (tests) │
   └────┬────┴────┬─────┘
        │         │
   ┌────▼─────────▼────┐
   │       DATA        │  Architecture review
   │  APPROVED?        │
   │  Yes → continue   │
   │  No → Torres fix  │ ← Self-healing loop (max 3×)
   └────────┬──────────┘
            │

STAGE 3: QA FORTRESS
═════════════════════
   ┌────────▼──────────┐
   │      TUVOK        │
   │  Unit tests?      │ → FAIL → Back to Torres
   │  Integration?     │ → FAIL → Back to Torres
   │  Security scan?   │ → FAIL → Flag to human
   │  Performance?     │ → WARN → Log, continue
   │  Spec compliance? │ → FAIL → Back to Torres
   └────────┬──────────┘
            │ ALL PASS

STAGE 4: SHIP DECK
═══════════════════
   ┌────────▼──────────┐
   │     CRUSHER       │ → B1_API_Reference.md
   │                   │ → B2_Developer_Documentation.md
   │                   │ → B3_Test_Suite_Plan.md (finalized)
   │                   │ → B5_Training_Guide.md
   └────────┬──────────┘
            │
   ┌────────▼──────────┐
   │     O'BRIEN       │ → Git commit + push
   │                   │ → Dockerfile + docker-compose.yml
   │                   │ → Live preview deployment
   │                   │ → .zip delivery package
   │                   │ → B7_Factory_Report.json
   └────────┬──────────┘
            │
            ▼
    📦 DELIVERY: 110% of scope
       Code + Tests + 13 Docs + Preview URL + Package
```

---

## Model Strategy

| Tier | Model | Agents | Why |
|------|-------|--------|-----|
| **Flash (Fast)** | Gemini 2.5 Flash | Jane, O'Brien, Crusher | Routing, packaging, docs — speed matters more than depth |
| **Pro (Deep)** | Gemini 3.1 Pro | Picard, Spock, Torres, Data, Tuvok, Sisko, Troi | Architecture, code, testing — reasoning quality matters |

**Future:** Torres and Data can be swapped to Claude Opus tier for superior code generation on complex projects.

---

## Self-Healing Protocol

```
Test FAIL detected
      │
      ▼
 Iteration < 3?
      │
  Yes ├──→ Pass exact error context to Torres
      │    Torres rewrites failing code
      │    Tuvok re-runs tests
      │    Data re-reviews
      │    → Attempt gate again
      │
  No  ├──→ 🚨 FLAG TO HUMAN
           Log failure in B7 Factory Report
           Pause pipeline, await intervention
```
