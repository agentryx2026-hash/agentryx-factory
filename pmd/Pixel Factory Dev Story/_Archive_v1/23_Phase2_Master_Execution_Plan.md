# 23 - Phase II Master Execution Plan (Updated)

## 1. Context
Documents 01–22 constitute the complete frozen architecture. Phase I delivered:
- ✅ Node.js v22 + pnpm workspace setup
- ✅ OpenClaw & Paperclip repos cloned and dependencies installed
- ✅ Agent sandbox (`~/Projects/agent-workspace`) created
- ✅ Docker Compose stack (Redis, PostgreSQL, ChromaDB, n8n, LangFuse) running
- ✅ Nginx reverse proxy with SSL on `dev-hub.agentryx.dev`
- ✅ Pixel Factory Dashboard scaffolded (Vite + React + TypeScript)

Phase II now brings this to life.

## 2. Phase II Execution Order

### Sprint 1: Production-Grade Dashboard (Layer 10) — NOW
**Rationale:** The dashboard is the single most visible deliverable. It proves the factory exists. All backend wiring is invisible; the UI makes it real.

| Task | Description | Status |
|------|-------------|--------|
| 1.1 | Complete overhaul of Pixel Factory UI — premium glassmorphism dark theme | 🔨 In Progress |
| 1.2 | Build all 6 factory floor zones with agent sprite system | 🔨 In Progress |
| 1.3 | Build Agent Activity Log panel (simulated, pre-WebSocket) | 🔨 In Progress |
| 1.4 | Build Infrastructure Health monitor panel (live Docker status) | 🔨 In Progress |
| 1.5 | Finalize Admin Settings page with full agent roster + model mapping | 🔨 In Progress |
| 1.6 | SEO, favicon, production meta tags | 🔨 In Progress |
| 1.7 | Run production build validation (`npm run build`) | Pending |

### Sprint 2: Boot The Execution Layer (Layers 1 & 4)
**Rationale:** The agents need hands. OpenClaw and Paperclip must be running daemons.

| Task | Description | Status |
|------|-------------|--------|
| 2.1 | Build OpenClaw daemon (`pnpm build && pnpm link --global`) | Pending |
| 2.2 | Start Paperclip server (`pnpm dev`) | Pending |
| 2.3 | Bind Google Gemini API key in Paperclip | Pending (needs key) |
| 2.4 | **Verification Gate:** API call creates a `.txt` in agent-workspace | Pending |

### Sprint 3: Webhook Automation (Layer 1 — n8n)
**Rationale:** The factory must receive jobs autonomously, not manually.

| Task | Description | Status |
|------|-------------|--------|
| 3.1 | Create n8n workflow: GitHub Issue → Job Payload JSON | Pending |
| 3.2 | Create n8n workflow: Job Payload → Paperclip API dispatch | Pending |
| 3.3 | **Verification Gate:** GitHub issue auto-triggers Paperclip agent | Pending |

### Sprint 4: Cognitive Wiring (Layers 2 & 3)
**Rationale:** The agents need brains that loop, not one-shot.

| Task | Description | Status |
|------|-------------|--------|
| 4.1 | Install LangChain + LangGraph npm packages | Pending |
| 4.2 | Build LangGraph state machine (Plan→Code→Test→Fix→Ship) | Pending |
| 4.3 | Wire LangChain tool definitions (file_read, file_write, terminal) | Pending |
| 4.4 | Connect agent reasoning loop to OpenClaw execution API | Pending |
| 4.5 | **Verification Gate:** Agent solves simple coding task autonomously | Pending |

### Sprint 5: Skill Learning Engine (Layer 5.5 — NEW)
**Rationale:** Agents must learn from past successes. See Doc 22.

| Task | Description | Status |
|------|-------------|--------|
| 5.1 | Create `skill_documents` table in PostgreSQL | Pending |
| 5.2 | Create `skill_embeddings` collection in ChromaDB | Pending |
| 5.3 | Build Skill Synthesizer middleware (post-task write path) | Pending |
| 5.4 | Build Skill Retriever middleware (pre-task read path) | Pending |
| 5.5 | **Verification Gate:** Agent recalls a past fix instead of re-reasoning | Pending |

### Sprint 6: Inter-Agent Communication (Layer 6)
**Rationale:** Charlie must hand off to Ralph automatically.

| Task | Description | Status |
|------|-------------|--------|
| 6.1 | Configure BullMQ job queues on existing Redis | Pending |
| 6.2 | Define message schemas (TASK_COMPLETE, REVIEW_REQUESTED, etc.) | Pending |
| 6.3 | Wire Paperclip agent handoff to BullMQ events | Pending |
| 6.4 | **Verification Gate:** Charlie finishes → Ralph automatically starts | Pending |

### Sprint 7: Live Dashboard Integration (Layer 10 — Phase 2)
**Rationale:** Connect the static UI to real WebSocket events.

| Task | Description | Status |
|------|-------------|--------|
| 7.1 | Implement WebSocket server in Paperclip/OpenClaw | Pending |
| 7.2 | Connect dashboard to live agent state stream | Pending |
| 7.3 | Animate agent sprites based on real-time state changes | Pending |
| 7.4 | **Verification Gate:** Agent visually moves on screen during task | Pending |

## 3. Current Focus
**Sprint 1 is executing NOW.** Building the production-grade Pixel Factory Dashboard.

---
**End of Document 23**
