# 05 — Implementation Status & Roadmap

---

## What's Built & Working ✅

| Component | Status | Details |
|-----------|--------|---------|
| **Dashboard UI** | ✅ Live | React + Vite, 4 pages (Factory Floor, Skill Memory, System Resources, Config) |
| **SSE Telemetry** | ✅ Live | Real-time agent state broadcasting, work item animations |
| **Cognitive Engine** | ✅ Live | LangGraph StateGraph with 6 dev agents (Jane, Spock, Torres, Data, Tuvok, O'Brien) |
| **Agent Tools** | ✅ Live | File read/write, terminal execution, git operations, telemetry broadcast |
| **Task Submission** | ✅ Live | Command bar on Factory Floor, triggers real pipeline |
| **Code Viewer** | ✅ Live | Browse generated files, view source, run from dashboard |
| **Code Runner** | ✅ Live | Execute generated files and see console output in browser |
| **Infrastructure** | ✅ Live | Redis, PostgreSQL, ChromaDB, n8n, LangFuse — all on Docker |
| **Domain + SSL** | ✅ Live | dev-hub.agentryx.dev with Nginx reverse proxy |
| **Nginx API Proxy** | ✅ Live | All API calls route through /telemetry/ instead of localhost |
| **Git Automation** | ✅ Live | O'Brien auto-commits generated code to workspace repo |
| **Bootstrap Script** | ✅ Ready | `./bootstrap.sh` for one-command deployment |
| **PMD Templates** | ✅ Ready | All 13 document templates created (A1-A6, B1-B7) |

---

## What Needs Building 🔨

### Phase A: Project Isolation & Enhanced Dev (Next)
| Task | Priority | Effort |
|------|----------|--------|
| Each task creates own project folder in workspace | 🔴 Critical | 1 day |
| Torres generates multi-file projects with proper structure | 🔴 Critical | 2 days |
| Tuvok writes actual test files alongside code (not just review) | 🔴 Critical | 2 days |
| Test runner tool — actually executes `npm test` and validates | 🔴 Critical | 1 day |
| Self-healing loop passes exact error context back to Torres | 🟡 High | 1 day |

### Phase B: Pre-Dev Pipeline (Picard, Sisko, Troi)
| Task | Priority | Effort |
|------|----------|--------|
| Add Picard agent — converts raw docs to A1 + A2 | 🔴 Critical | 2 days |
| Add Sisko agent — creates A3 + A4 + A5 from Picard's output | 🔴 Critical | 2 days |
| Add Troi agent — generates B4 + B6 (AI enhancements + quick wins) | 🟡 High | 1 day |
| PMD folder auto-creation per project | 🟡 High | 1 day |
| Human gate UI — review PMD before dev starts | 🟡 High | 2 days |

### Phase C: Ship Deck
| Task | Priority | Effort |
|------|----------|--------|
| Add Crusher agent — generates B1, B2, B5 documentation | 🟡 High | 2 days |
| Live preview deployment (Replit-style, port 9001+) | 🟡 High | 2 days |
| Nginx dynamic proxy for preview URLs | 🟡 High | 1 day |
| .zip package generation and download from dashboard | 🟡 High | 1 day |
| GitHub repo auto-creation for finished projects | 🟢 Medium | 1 day |
| B7 Factory Report auto-generation | 🟢 Medium | 1 day |

### Phase D: Dashboard Enhancements
| Task | Priority | Effort |
|------|----------|--------|
| "Projects" page — browse all completed apps | 🟡 High | 2 days |
| PMD Viewer — review specs in dashboard before approving | 🟡 High | 2 days |
| Preview embed — iframe showing live running app | 🟡 High | 1 day |
| Download center — .zip packages per project | 🟢 Medium | 1 day |
| Human approval workflow UI (approve/reject gates) | 🟢 Medium | 2 days |
| Task queue — submit multiple tasks, process sequentially | 🟢 Medium | 2 days |

### Phase E: Intelligence Layer
| Task | Priority | Effort |
|------|----------|--------|
| Confidence scoring — agents rate their own confidence | 🟢 Medium | 1 day |
| Skill Memory active — agents learn from past projects | 🟢 Medium | 3 days |
| Multi-model support — swap Torres/Data to Claude Opus | 🟢 Medium | 2 days |
| Dockerfile auto-generation per project | 🟢 Medium | 1 day |

---

## Progressive Automation Targets

| Milestone | AI % | Human Role | Target |
|-----------|------|-----------|--------|
| **Current** | 40% | Driver — actively writing/fixing code alongside agents | ✅ Now |
| **Phase A+B complete** | 60% | Reviewer — rubber-stamping agent output | 4-6 weeks |
| **Phase C+D complete** | 80% | Producer — defining specs, reviewing outcomes | 2-3 months |
| **Phase E complete** | 90%+ | Strategist — steering direction, exception handling | 6 months |
