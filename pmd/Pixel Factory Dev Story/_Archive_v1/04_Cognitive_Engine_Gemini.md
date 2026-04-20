# 04 - Cognitive Engine Architecture: Shifting to Google Gemini

## 1. Decision Log
* **Date:** 2026-03-29
* **Pivot:** Shifted the primary reasoning engine for the OpenClaw factory agents from Anthropic Claude 3.5 Sonnet to Google Gemini (Ultra / Pro).
* **Rationale:** The user possesses a Google AI Ultra subscription.

## 2. Why Gemini is an Advantage for a "Dev Factory"
While Claude is often the default script in many older generic tutorials, running the factory on **Google Gemini 1.5 Pro / Ultra** gives the architecture a significant architectural advantage that changes how the factory computes:

1. **The Massive Context Window (1M to 2M Tokens):**
   * Standard agent frameworks (like LangChain) typically waste a lot of compute relying on Vector Databases (RAG) to chop up repositories into tiny, readable pieces because older models max out at 128k context.
   * **Gemini** can ingest entire repositories (up to 2 million tokens), complete with thousands of files of codebase, at once. The agents (Charlie, Henry) will not need to blindly "guess and search" variables; Gemini can hold the entire project architecture in active memory while it codes.

2. **Multimodal Native Execution:**
   * Because Gemini is natively multimodal, if an agent causes a graphical error in the front-end (e.g., UI rendering issue), the agent can literally look at screenshots of its own compiled UI via OpenClaw and debug visually.

## 3. Implementation Step Updates
Instead of binding an Anthropic Key. The Paperclip & OpenClaw local configuration must now utilize the Gemini integration map. When the local Paperclip UI is booted on `http://localhost:3100`, the primary LLM config drop-down must be set to `Google Gemini (Ultra/Pro)` utilizing the Google Gen AI / Vertex AI API key.

---
**End of Document 04**
