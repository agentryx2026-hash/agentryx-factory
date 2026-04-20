# 01 - System Design & Architecture: The Autonomous Pixel Factory

## 1. Executive Summary
This document outlines the high-level architecture for building a fully autonomous, 100% simulated "Pixel Factory." The system operates without human intervention (zero-human baseline) where multiple specialized AI agents receive tasks, reason about code, execute changes in a sandbox, review work, and visibly move between simulated "rooms" (Break Room, Build, QA) on a custom visual dashboard.

## 2. Core Architectural Layers

The factory relies on specific, compartmentalized layers so that the system remains stable, observable, and extensible.

### Layer 1: The Input & Triage (n8n)
* **Purpose:** The nervous system that connects the factory to the outside world.
* **Component:** n8n (Workflow Automation).
* **Mechanics:** 
  * Listens for incoming requests via Webhooks (e.g., Jira tickets, Slack channels, GitHub Issues).
  * Cleans the unstructured data and converts it into a rigid, JSON-formatted "Job Description".
  * Assigns Priority and passes the Job via API to the Fleet Manager.

### Layer 2: The Fleet Manager & Orchestrator (Paperclip)
* **Purpose:** The Engineering Manager.
* **Component:** Paperclip AI.
* **Mechanics:** 
  * Receives the JSON Job from n8n.
  * Dynamically spawns or wakes up specific agent instances (e.g., "Charlie" the UI Dev, "Henry" the QA Engineer).
  * Maintains the top-level state of the ticket and coordinates handover between agents so the context window of individual LLMs doesn't overflow.

### Layer 3: The Mind & Reasoning Cycle (LangChain / LangGraph / Google Gemini)
* **Purpose:** The cognitive abilities of the individual workers.
* **Component:** LangChain & LangGraph framework pointing to Google Gemini (Ultra / Pro).
* **Mechanics:**
  * **Massive Context:** Gemini brings a 1M-2M context window advantage, meaning the agent can hold vast swaths of the codebase in its immediate memory, minimizing vector DB reliance.
  * **LangGraph:** Forces the LLM into a cyclical thinking pattern (Draft -> Compile -> Read Error -> Refine) rather than a linear failure.
  * **Vector DB / RAG:** Gives the agents the ability to dynamically "search" the exact syntax instead of loading files unnecessarily.

### Layer 4: The Hands & Environment (OpenClaw)
* **Purpose:** The physical execution sandbox.
* **Component:** OpenClaw nodes running on Ubuntu/Linux.
* **Mechanics:**
  * Agents use OpenClaw APIs to physically touch the file system.
  * Allows agents to execute `npm install`, edit `css` files, run bash scripts, and interact with `git`.
  * Every execution step emits a strict "State Change Event" via WebSockets (e.g., `AGENT_CHARLIE_STATUS: RUNNING_BUILD_SCRIPT`).

### Layer 5: The "Pixel Factory" Visualizer (Custom Front-End)
* **Purpose:** The simulated 8-bit factory floor.
* **Component:** A custom React.js Single Page Application (SPA).
* **Mechanics:**
  * Subscribes to the OpenClaw / Paperclip state event stream via WebSockets or Server-Sent Events (SSE).
  * Uses a CSS Grid or HTML5 Canvas framework to map out rooms: `BACKLOG`, `BREAK ROOM`, `BUILD`, `QA`, `REVIEW`, `SHIP`.
  * Dynamically animates 8-bit pixel sprites moving between coordinates on the screen the exact moment a background OpenClaw API event indicates a state change.

## 3. Data Flow Overview
1. **Trigger:** Human tags `[Auto]` on a GitHub Issue.
2. **Transfer:** n8n pulls the Issue diff, parses it, and pushes it to Paperclip.
3. **Dispatch:** Paperclip assigns "Charlie" (Developer Agent) and dispatches the context.
4. **Action (Visible):** The visual React dashboard sees Charlie's state change to `WORKING` and animates him walking into the `BUILD` room.
5. **Execution:** Charlie uses OpenClaw to edit the code. He fails tests, thinks using LangGraph, and fixes his code.
6. **Handover (Visible):** Charlie finishes. Paperclip assigns "Henry" (QA). The dashboard animates Charlie walking to `BREAK ROOM` and Henry walking into `QA`.
7. **Ship:** Henry uses OpenClaw to commit to Git and open a Pull Request.

---
**End of Document 01**
