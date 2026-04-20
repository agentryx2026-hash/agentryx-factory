# 04 — PMD Standard: The 13-Document Scope

> Every project, regardless of input format, gets converted into exactly 13 documents.

---

## A-Series: Project-Specific (6 Documents)

*Unique to each project. Created by Picard + Sisko.*

| # | Document | Created By | Purpose |
|---|----------|-----------|---------|
| **A1** | Solution Brief | Picard | WHAT we're building and WHY |
| **A2** | Solution Architecture | Picard | Tech stack, system design, data model, security |
| **A3** | Module Breakdown | Sisko | Feature modules with dependencies and effort estimates |
| **A4** | Dev Plan & Phasing | Sisko | Sprint plan, phase gates, agent assignments |
| **A5** | Phase-wise PRD | Sisko | Exact function-level specs with input/output schemas and test scenarios |
| **A6** | Acceptance Criteria | Picard | The definitive "done" checklist — functional, non-functional, delivery |

---

## B-Series: Agentryx Standard (7 Documents)

*Same structure for EVERY project. The Agentryx quality guarantee.*

| # | Document | Created By | Purpose |
|---|----------|-----------|---------|
| **B1** | API Reference | Crusher | Every endpoint with params, responses, curl examples |
| **B2** | Developer Documentation | Crusher | Clone → install → run in 5 minutes |
| **B3** | Test Suite Plan | Tuvok | Test inventory, scenarios, coverage, execution results |
| **B4** | AI Enhancement Report | Troi | Where AI/ML can add transformative value |
| **B5** | Training Guide | Crusher | End-user how-to, per-feature walkthrough |
| **B6** | Quick Wins 110% | Troi | The extra 10% — low-effort features beyond scope |
| **B7** | Factory Report | O'Brien | Full pipeline audit trail (JSON, auto-generated) |

---

## Document Flow

```
Customer Input → Picard → A1, A2 → Sisko → A3, A4, A5 → Picard → A6
                                  → Troi  → B4, B6
                                  
Dev Pipeline  → Tuvok → B3 (built in real-time alongside code)

Ship Deck     → Crusher → B1, B2, B5
              → O'Brien → B7 (auto-generated)
```

---

## Folder Structure Per Project

```
agent-workspace/{project-name}/
├── PMD/
│   ├── A1_Solution_Brief.md
│   ├── A2_Solution_Architecture.md
│   ├── A3_Module_Breakdown.md
│   ├── A4_Dev_Plan_Phasing.md
│   ├── A5_PRD_Phase1.md
│   ├── A5_PRD_Phase2.md
│   └── A6_Acceptance_Criteria.md
├── src/                              ← Application code
├── tests/                            ← Test suite
├── docs/
│   ├── B1_API_Reference.md
│   ├── B2_Developer_Documentation.md
│   ├── B3_Test_Suite_Plan.md
│   ├── B4_AI_Enhancement_Report.md
│   ├── B5_Training_Guide.md
│   └── B6_Quick_Wins_110.md
├── package.json
├── Dockerfile
├── docker-compose.yml
├── .env.example
└── B7_Factory_Report.json
```

---

## Templates

All 13 document templates are maintained at:
```
/Projects/PMD/Dev Scop & Plan/
├── A.Project Scope/     ← A1-A6 templates
└── B.Standard Scope/    ← B1-B7 templates
```

These templates define the exact sections, tables, and placeholders that agents fill in for each project.
