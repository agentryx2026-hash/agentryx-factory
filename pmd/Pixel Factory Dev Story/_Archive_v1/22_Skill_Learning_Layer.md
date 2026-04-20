# 22 - Layer 5.5: Skill Learning Engine (Self-Improving Agents)

## 1. Origin
Inspired by the NousResearch "Hermes Agent" framework's persistent Skill Document system. Hermes Agent itself was evaluated and **rejected** as a stack component (see analysis artifact), but its core idea — agents that learn from past successes and recall solutions instead of re-reasoning from scratch — is the single most impactful upgrade available for zero additional cost.

## 2. Problem Statement
In the current architecture, every time Charlie receives a new ticket, he starts from absolute zero. Even if he solved an identical CSS Grid bug last Tuesday, his LangGraph loop will re-reason from scratch, burning the same API tokens, taking the same time, and potentially re-discovering the same wrong paths before finding the fix.

This is wasteful. A human junior developer remembers past fixes. Our agents should too.

## 3. Architecture: Where It Sits

```
┌─────────────────────────────────────────────────────────┐
│  LAYER 10: VISUAL TELEMETRY (Pixel Factory Dashboard)   │
├─────────────────────────────────────────────────────────┤
│  LAYER 9:  OBSERVABILITY (LangFuse - Agent Tracing)     │
├─────────────────────────────────────────────────────────┤
│  LAYER 8:  COST GUARDRAILS (Budget Monitor per Agent)   │
├─────────────────────────────────────────────────────────┤
│  LAYER 7:  CI/CD (GitHub Actions - Auto Deploy)         │
├─────────────────────────────────────────────────────────┤
│  LAYER 6:  MESSAGE QUEUE (Redis/BullMQ - Conveyor Belt) │
├─────────────────────────────────────────────────────────┤
│  ★ LAYER 5.5: SKILL LEARNING ENGINE (NEW) ★             │
├─────────────────────────────────────────────────────────┤
│  LAYER 5:  MEMORY (PostgreSQL + pgvector + ChromaDB)    │
├─────────────────────────────────────────────────────────┤
│  LAYER 4:  EXECUTION SANDBOX (OpenClaw)                 │
├─────────────────────────────────────────────────────────┤
│  LAYER 3:  REASONING ENGINE (LangGraph State Machines)  │
├─────────────────────────────────────────────────────────┤
│  LAYER 2:  AGENT WIRING (LangChain + Tool Definitions)  │
├─────────────────────────────────────────────────────────┤
│  LAYER 1:  ORCHESTRATION (Paperclip + n8n Webhooks)     │
├─────────────────────────────────────────────────────────┤
│  LAYER 0:  BRAINS (Gemini / Claude / Qwen / Ollama)     │
└─────────────────────────────────────────────────────────┘
```

Layer 5.5 sits **between** the raw memory layer (PostgreSQL/ChromaDB) and the message queue (Redis/BullMQ). It acts as a middleware that:
* **Writes** after every successful task completion.
* **Reads** before every new task assignment.

## 4. How It Works

### 4.1 The "Skill Document" Schema (PostgreSQL)
```sql
CREATE TABLE skill_documents (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id      VARCHAR(50) NOT NULL,        -- 'charlie', 'henry', 'ralph'
  ticket_type   VARCHAR(100) NOT NULL,       -- 'css-bug', 'api-endpoint', 'db-migration'
  tech_stack    TEXT[] NOT NULL,              -- ['react', 'tailwind', 'postgresql']
  problem       TEXT NOT NULL,               -- Natural language: "CSS Grid items overflowing on mobile"
  solution      TEXT NOT NULL,               -- Natural language: "Added `min-width: 0` to grid children"
  code_diff     TEXT,                        -- Optional: the actual patch that fixed it
  success       BOOLEAN DEFAULT TRUE,        -- Only store successes
  tokens_saved  INT,                         -- Estimated tokens this skip will save in future
  created_at    TIMESTAMP DEFAULT NOW()
);
```

### 4.2 The "Skill Embedding" (ChromaDB)
Each Skill Document also gets a semantic vector embedding stored in ChromaDB:
* **Collection:** `skill_embeddings`
* **Document:** The concatenation of `problem + solution + tech_stack`
* **Metadata:** `{ agent_id, ticket_type, created_at }`

### 4.3 The Write Path (After Task Success)
```
Agent completes task successfully
       │
       ▼
LangGraph final node ("TASK_COMPLETE")
       │
       ▼
Skill Synthesizer Middleware
  → Extracts: What was the problem? What was the fix?
  → Writes structured Skill Document to PostgreSQL
  → Generates embedding, stores in ChromaDB
       │
       ▼
LangFuse logs: "Skill Document #47 created by charlie"
```

### 4.4 The Read Path (Before Task Start)
```
New ticket arrives from Paperclip
       │
       ▼
Skill Retriever Middleware
  → Generates embedding from new ticket description
  → Queries ChromaDB for top-3 similar Skill Documents
  → If similarity > 0.85: Injects Skill Document as context
       │
       ▼
LangGraph starts reasoning with pre-loaded knowledge
  → Agent sees: "I've solved something similar before..."
  → Skips 3-5 reasoning loops → Cheaper, faster, more accurate
```

## 5. Expected Impact

| Metric | Without Skill Learning | With Skill Learning |
|--------|----------------------|---------------------|
| Avg. tokens per repeat task | ~15,000 | ~3,000 (80% reduction) |
| Avg. time per repeat task | ~4 min | ~45 sec |
| Error rate on known patterns | ~20% | ~2% |
| Monthly API cost (at scale) | $150+ | ~$40 |

## 6. Implementation Priority
This layer requires Layers 1-5 to be operational first (Paperclip receiving tasks, LangGraph running loops, PostgreSQL/ChromaDB storing data). It will be implemented as a middleware module **after** the core agent loop is validated.

**Phase:** Build during Phase 4 (LangGraph Cognitive Refinement & Tuning), specifically after Task 4.1 (LangGraph cyclical reasoning templates) is verified.

## 7. No New Tools Required
This feature is built entirely on top of existing infrastructure:
* PostgreSQL ✅ (already running)
* ChromaDB ✅ (already running)
* LangFuse ✅ (already running)
* Additional cost: **$0.00**

---
**End of Document 22**
