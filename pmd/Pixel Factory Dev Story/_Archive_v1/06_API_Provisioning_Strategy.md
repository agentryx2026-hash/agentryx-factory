# 06 - API Provisioning Strategy: Google Gemini 

## 1. Issue Addressed
Can consumer Google AI Ultra (Gemini Advanced) subscriptions be used to feed the Developer API backends for OpenClaw?

## 2. Technical Clarification
There is a distinct separation between Consumer interfaces and Developer infrastructure within the Google ecosystem:

* **Consumer Subscription (Google One AI Premium):** This provides access to the "Gemini Advanced / Ultra" web chat application. It does **not** provide API keys for coding frameworks. You cannot plug your consumer subscription directly into OpenClaw or LangGraph.
* **Developer Platform (Google AI Studio / Vertex AI):** This is where programmable access is granted. LangGraph requires a specific API String (e.g., `AIzaSy...`) to authenticate requests.

## 3. The Recommended Solution & Sandbox Deployment
The factory relies on **Gemini 1.5 Pro** via **Google AI Studio** rather than the consumer Ultra iteration.

Why?
1. **Free Developer Tier:** Google AI Studio offers a robust free tier for Gemini 1.5 Pro and Gemini 1.5 Flash. The factory can be prototyped and run practically for free under the standard rate limits.
2. **Superior Context:** Gemini 1.5 Pro features the 1M to 2M token context window, which is strictly superior to the original Gemini Ultra for coding tasks and repository (RAG) scanning. 
3. **Action Required:** The user simply needs to navigate to `aistudio.google.com`, generate a free API key, and deposit it into the custom "Admin Configuration" UI generated in Phase 3.

---
**End of Document 06**
