# 20 - Phase 2 Execute: Infrastructure Stack Online

## 1. Objective
Install and boot the core infrastructure services required by the Autonomous Factory.

## 2. Actions Completed

### 2.1 Docker Engine Installation
* **Action:** Installed Docker Engine v29.3.1 and Docker Compose v5.1.1 on Ubuntu 24.04.
* **Result:** ✅ Fully operational. User added to `docker` group.

### 2.2 Docker Compose Stack Creation
* **Action:** Authored a master `docker-compose.yml` at `~/Projects/pixel-factory-ui/docker-compose.yml` defining all 5 core infrastructure services.
* **Command:** `sudo docker compose up -d`

### 2.3 Services Online

| Service | Container | Port | Status |
|---------|-----------|------|--------|
| Redis 7 (Message Queue) | factory-redis | :6379 | ✅ Healthy |
| PostgreSQL 16 (Agent Memory) | factory-postgres | :5432 | ✅ Healthy |
| ChromaDB (Vector DB / RAG) | factory-chromadb | :8000 | ✅ Up |
| n8n (Webhook Automation) | factory-n8n | :5678 | ✅ Up |
| LangFuse v2 (Agent Observability) | factory-langfuse | :3000 | ✅ Up |

### 2.4 Access Points
* **n8n Automation Hub:** http://localhost:5678 (login: admin / factory2026)
* **LangFuse Observability:** http://localhost:3000
* **ChromaDB API:** http://localhost:8000
* **PostgreSQL:** localhost:5432 (user: factory / pass: factory_dev_2026)
* **Redis:** localhost:6379
* **Pixel Factory Dashboard:** http://localhost:5173 (already running from Phase 1)

## 3. System Resource Snapshot
* **Machine:** Ubuntu 24.04 LTS, 2 CPU, 8GB RAM, no GPU
* **Node.js:** v22.22.2, pnpm 10.33.0
* **Note:** No GPU available. Local LLM hosting (Ollama/Nemotron) will require either a GPU upgrade or cloud API fallback. All agents will initially use Google Gemini API.

---
**End of Document 20**
