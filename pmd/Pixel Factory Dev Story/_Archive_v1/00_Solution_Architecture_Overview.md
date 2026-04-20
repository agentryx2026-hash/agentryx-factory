# 00 - Solution Architecture Overview: Agentryx AI Factory

## 1. Executive Summary
The **Agentryx AI Factory** is a fully autonomous, zero-human-intervention software development environment. Operating on a robust local and cloud hybrid infrastructure, it listens for external triggers (like Jira or GitHub tickets), automatically routes them to specialized AI Agents, writes and tests the code in a sandboxed runtime, and opens Pull Requests upon successful validation. 

A defining feature of the Agentryx Factory is the **"Pixel Dashboard"**—a custom visual simulation layer where real-time internal architectural states (e.g., an agent executing tests vs. writing code) are mapped onto a digital factory floor visually utilizing 8-bit agent avatars.

---

## 2. Core Architectural Layers (The 5 Pillars)
The Agentryx system is completely decoupled, ensuring stability and scale:

*   **Layer 1: Input & Nervous System (n8n)**
    *   Acts as the webhook gateway. It intercepts incoming GitHub Issues or Jira tickets, filters the noise, and sanitizes them into standardized JSON payload dispatch commands.
*   **Layer 2: Fleet Management (Paperclip AI)**
    *   The "Engineering Manager." It maintains the master queue, provisions agents dynamically based on workload, and tracks high-level state.
*   **Layer 3: The Cognitive Brain (LangGraph + Google Gemini 2.5 Pro)**
    *   The reasoning loop. Instead of linear top-down execution, agents use LangGraph state machines (`Plan -> Code -> Test -> Fix -> Ship`). By utilizing Gemini's massive 2M context window, agents comprehend the entire repository structure at once.
*   **Layer 4: The Hands & Physical Sandbox (OpenClaw)**
    *   The execution sandbox. OpenClaw allows agents to manipulate file systems, install NPM dependencies, and run bash terminal commands securely without breaking the host machine.
*   **Layer 5: Long-Term Memory (ChromaDB + PostgreSQL)**
    *   Agents are not stateless. The Skill Engine encodes solutions of successfully closed tickets into vector embeddings, allowing future agents to retrieve past snippets instead of re-reasoning entire complex problems.

---

## 3. The 5-Phase Development Master Plan
The factory construction is divided into five rigid milestones:

1.  **Phase 1: Foundation & Sandbox (Complete)**
    *   *Goal:* Establishing the OpenClaw execution environment and proving programmatic system file manipulation.
2.  **Phase 2: Orchestration & Brains (Complete)**
    *   *Goal:* Finalizing n8n webhooks, the Paperclip agent queue, the LangGraph cognitive loops, and Semantic Semantic Memory (ChromaDB).
3.  **Phase 3: The "Pixel" Visual Simulation (Upcoming)**
    *   *Goal:* Connecting the deep backend WebSocket telemetry events into the React.js frontend. Agents will visibly animate moving between designated digital "Rooms" (Backlog, Build, QA) relative to their live runtime state.
4.  **Phase 4: Cognitive Tuning & Refinement**
    *   *Goal:* Hardening the LangGraph system prompts. Ensuring agents know how to read failure stack traces perfectly and auto-correct.
5.  **Phase 5: End-to-End Validation & Shipping**
    *   *Goal:* The system is bound to definitive production guardrails (e.g., Agents can only write Pull Requests, never direct `main` branch pushes). The factory is cleared for live enterprise load.

---

## 4. The Data Flow Pipeline
1. **Trigger:** A user labels a GitHub Issue as `[Auto]`.
2. **Translate:** **n8n** converts the raw issue to a Job Payload via API.
3. **Dispatch:** **Paperclip** spawns "Charlie" (a LangGraph worker) to resolve it.
4. **Action:** Charlie uses **OpenClaw** tools to edit `index.js`.
5. **Observability:** As Charlie works, the **Pixel Dashboard** animates him walking into the *Build Room*.
6. **Deploy & Learn:** Charlie successfully passes his internal sandbox tests, commits the remote PR cleanly, and semantic **ChromaDB** archives his codebase solution for future tasks.
