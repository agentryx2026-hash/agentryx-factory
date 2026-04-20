# 02 - Development Plan & Phasing strategy: The Autonomous Pixel Factory

## 1. Roadmap Overview
To ensure a reliable and successful build, the factory must be developed incrementally. We cannot build the visual simulation roof before pouring the orchestration concrete. 

The approach relies on setting up the deep back-end logic first, enabling physical file manipulation second, establishing the visual telemetry layer third, and tuning the cognitive logic last.

## 2. Phase 1: Foundation & The Hands (Milestone 1)
**Goal:** Verify that a programmatic API call can result in a physical file change on the local machine.
* **Task 1.1:** Finalize Node.js (`v22`) and `pnpm` workspace setup for OpenClaw and Paperclip.
* **Task 1.2:** Initialize the OpenClaw daemon and authenticate local workspace permissions.
* **Task 1.3:** Build a rigid, sandbox "Target Repository" for the agents to safely break and fix code inside without harming system files.
* **Task 1.4:** Create bare-minimum test agents ("Charlie" and "Henry") in Paperclip mapping to specific Anthropic Claude 3.5 API keys.
* **Verification Gate:** A simple curl/API request to OpenClaw successfully creates a `.txt` file in the dummy environment.

## 3. Phase 2: The Automations & Brains (Milestone 2)
**Goal:** Abstract human input entirely by hooking external triggers to the Agent workflows safely.
* **Task 2.1:** Install & configure local `n8n` workflow server instance.
* **Task 2.2:** Set up GitHub / Linear / Jira webhook intake inside `n8n` to catch "Help Wanted" tasks.
* **Task 2.3:** Write the JSON transformation scripts in n8n to map a raw issue into a normalized "Job Payload".
* **Task 2.4:** Connect n8n to Paperclip API dispatch endpoint so Paperclip automatically queues jobs into its backlog.
* **Verification Gate:** Creating an issue on GitHub automatically triggers a terminal process deep inside the Paperclip server.

## 4. Phase 3: The "Pixel Factory" Visual Dashboard (Milestone 3)
**Goal:** Expose the internal "thoughts/actions" of the OpenClaw agents to a visual browser application mirroring the 8-bit simulation.
* **Task 3.1:** Write the Event Listener layer in Paperclip/OpenClaw to broadcast WebSockets or SSE logs (e.g., `START_CODING`, `IDLE`, `RUNNING_TESTS`).
* **Task 3.2:** Bootstrap a custom React.js frontend (`vite`, `tailwindcss`).
* **Task 3.3:** Design the CSS Grid static map (Break Room, Build, QA, Ship boundaries).
* **Task 3.4:** Build the Sprite Engine: A context provider that shifts 8-bit character avatars (`<img src="charlie-pixel.png" />`) from Grid A to Grid B based on the real-time WebSocket state JSON payload.
* **Verification Gate:** While OpenClaw executes a terminal command, the web UI visibly shows a pixel avatar sitting in the "Build" zone.

## 5. Phase 4: LangGraph Cognitive Refinement & Tuning (Milestone 4)
**Goal:** Ensure the agents actually produce good code, rather than blindly failing syntax errors in loops.
* **Task 4.1:** Integrate LangGraph templates for cyclical reasoning (Ensure agent reads stack-trace when a test fails).
* **Task 4.2:** Refine System Prompts ("You are Charlie. You must use `npm run build` after editing CSS.").
* **Task 4.3:** Setup Vector memory limits so tokens do not excessively drain the API balance.
* **Verification Gate:** The agent successfully solves a mid-tier CSS padding issue and passes the build test completely unassisted.

## 6. Phase 5: End-to-End Validation & Shipping Rules (Milestone 5)
**Goal:** The handover to deployment. 
* **Task 5.1:** Finalize the GitHub PAT (Personal Access Token) configurations inside OpenClaw.
* **Task 5.2:** Set strict "Human-in-the-Loop" fallback limitations. The agent is ONLY allowed to create Pull Requests, never direct-pushing to `main`.
* **Task 5.3:** Validate that if CI/CD fails on the PR, GitHub Actions fires a webhook back to n8n, throwing Charlie back into the `BUILD` room visibly.
* **Verification Gate:** Zero-human input from start to creating a perfectly formatted, passing Pull Request on GitHub.

---
**End of Document 02**
