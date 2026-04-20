# 02 — System Architecture

---

## Full Pipeline Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        AGENTRYX 110 LABS                            │
│                                                                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────────┐ │
│  │   INTAKE     │  │   PRE-DEV   │  │         DEV FLOOR           │ │
│  │   Dept.      │→ │   PMD       │→ │                             │ │
│  │             │  │   Dept.     │  │ Jane → Spock → Torres/Tuvok │ │
│  │  Picard     │  │  Sisko      │  │          → Data → O'Brien   │ │
│  │             │  │  Troi       │  │                             │ │
│  └─────────────┘  └─────────────┘  └──────────────┬──────────────┘ │
│                                                     │               │
│  ┌─────────────────────────────────┐  ┌────────────▼──────────────┐ │
│  │       SHIP DECK                 │← │      QA FORTRESS          │ │
│  │                                 │  │                           │ │
│  │  Crusher (Docs)                │  │  Tuvok (Tests)            │ │
│  │  O'Brien (Package + Preview)   │  │  Unit + Integration       │ │
│  │  Troi (110% Report)           │  │  Security + Performance   │ │
│  └─────────────────────────────────┘  └───────────────────────────┘ │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │                    INFRASTRUCTURE LAYER                         │ │
│  │  Redis • PostgreSQL • ChromaDB • n8n • LangFuse • Nginx/SSL   │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │                    DASHBOARD (Pixel Factory UI)                  │ │
│  │  Factory Floor • Skill Memory • System Resources • Config      │ │
│  │  Projects Browser • Code Viewer • Preview Embed • Download     │ │
│  └─────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Orchestration** | LangGraph (StateGraph) | Latest | Agent pipeline, conditional routing, self-healing loops |
| **AI Models** | Gemini 2.5 Flash | Latest | Fast agents (Jane, O'Brien, Crusher) |
| **AI Models** | Gemini 3.1 Pro | Latest | Deep reasoning agents (Picard, Spock, Torres, Data, Tuvok, Sisko, Troi) |
| **Dashboard** | React + Vite + TypeScript | React 19, Vite 6 | Real-time visual factory UI |
| **Telemetry** | Custom Node.js SSE Server | Port 4401 | Real-time agent state broadcasting |
| **Metrics** | Custom Node.js API | Port 4400 | System resource monitoring (CPU, RAM, disk) |
| **Database** | PostgreSQL 16 | 16.x | Agent memory, skill storage, project metadata |
| **Cache** | Redis 7 | 7.x | Message queue, session management |
| **Vector Store** | ChromaDB | 8000 | Semantic search, RAG, skill embeddings |
| **Workflow** | n8n | 5678 | Webhook automation, GitHub integration |
| **Observability** | LangFuse | 3000 | Agent trace logging, cost tracking |
| **Reverse Proxy** | Nginx + Certbot | Latest | SSL, domain routing, API proxying |
| **Domain** | dev-hub.agentryx.dev | — | Single entry point for all services |
| **Version Control** | Git + GitHub | — | Code versioning, auto-commit, PR creation |

---

## Service Map

| Service | Port | Nginx Route | Purpose |
|---------|------|-------------|---------|
| Vite Dashboard | 5173 | `/` (root) | Factory UI |
| Telemetry Broker | 4401 | `/telemetry/` | SSE stream + Factory API |
| Metrics API | 4400 | `/api/` | System resources |
| Redis | 6379 | Internal | Message queue |
| PostgreSQL | 5432 | Internal | Agent memory |
| ChromaDB | 8000 | `/chromadb/` | Vector/RAG |
| n8n | 5678 | `/n8n/` | Webhooks |
| LangFuse | 3000 | `/langfuse/` | Tracing |
| Preview Apps | 9001-9099 | `/preview/{project}/` | Live app previews |

---

## Data Flow

```
Customer Input (SRS/FRS/TOR/text)
      │
      ▼
┌─────────────────┐
│ Telemetry Broker │ ← Receives task via /telemetry/factory/run
│ (Port 4401)      │
└────────┬────────┘
         │ Spawns child process
         ▼
┌─────────────────┐
│ Cognitive Engine │ ← LangGraph StateGraph executes
│ (factory_graph)  │
│                  │──→ Broadcasts agent state via HTTP to Telemetry
│                  │──→ Writes files to agent-workspace/{project}/
│                  │──→ Runs tests via terminal tool
│                  │──→ Git commits via git tool
└────────┬────────┘
         │ SSE broadcast
         ▼
┌─────────────────┐
│ Dashboard UI     │ ← Receives SSE events, updates in real-time
│ (Port 5173)      │   Shows agent movement, work items, logs
└─────────────────┘
```

---

## Security Architecture

| Layer | Protection |
|-------|-----------|
| **Network** | Nginx SSL (Let's Encrypt), HTTPS-only |
| **API** | CORS whitelist, rate limiting |
| **Agent Sandbox** | Agents can only write to `agent-workspace/` |
| **Self-Healing Limit** | Max 3 retry iterations before human flag |
| **Secrets** | `.env.factory` (gitignored), no keys in code |
| **Audit** | B7 Factory Report traces every agent action |

---

## File System Layout

```
/home/subhash.thakur.india/Projects/
├── pixel-factory-ui/              ← Dashboard + Telemetry
│   ├── src/components/            ← React UI components
│   ├── server/telemetry.mjs       ← SSE Broker + API
│   ├── server/metrics.mjs         ← System metrics
│   ├── cognitive-engine/          ← LangGraph brain (bundled)
│   ├── bootstrap.sh               ← One-command installer
│   └── docker-compose.yml         ← Infrastructure stack
│
├── cognitive-engine/              ← LangGraph brain (development copy)
│   ├── factory_graph.js           ← StateGraph with 10 agents
│   ├── tools.js                   ← File/terminal/git/telemetry tools
│   └── .env                       ← API keys
│
├── agent-workspace/               ← Where agents write code
│   └── {project-name}/            ← One folder per project
│
└── PMD/                           ← Project Management Documents
    ├── Dev Scop & Plan/           ← Standard templates (A1-A6, B1-B7)
    └── Pixel Factory Dev Story/   ← This documentation
```
