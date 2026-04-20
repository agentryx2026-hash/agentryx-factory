# AntiGravity LLM Bridge Protocol
**Status:** Active | **Type:** Architectural Workaround / Ad-Hoc Proxy
**Created:** 2026-04-02

## 1. Context & Rationale
During the construction of the 10-Agent Autonomous Software Factory (`dev_graph.js`), we encountered hard `429 Too Many Requests` quota limitations from Google Generative AI when using local `.env` API keys. The node process would immediately crash or loop infinitely trying to fulfill prompts via the public `generativelanguage.googleapis.com` endpoint.

Rather than procuring new paid API keys, we devised a system to "bridge" or route the LangGraph prompt payload directly to the **Antigravity IDE Assistant** (which operates on a completely independent and massive internal token quota).

Because the Antigravity Assistant operates in an isolated secure sandbox and cannot expose a local `localhost` HTTP proxy for `dev_graph.js` to hit directly, we built an asynchronous file-based polling system.

## 2. How the Bridge Works
We wrote a custom LangChain implementation called `AntigravityBridgeLLM.js` designed to intercept system completion requests.

**The Polling Loop:**
1. **Agent Queries (The Hook):** When an agent (like Jane or Torres) calls `model.invoke()`, the bridge intercepts the LangChain payload.
2. **File Dump:** It formats the structured prompts and writes them as a JSON file to `/tmp/req_{TIMESTAMP}.json`.
3. **Holding Pattern:** The Node.js agent puts itself into a non-blocking `while()` loop, checking every 2 seconds for a response file.
4. **Human/AI-in-the-Loop Notification:** The Factory dashboard or user indicates that prompts are pending.
5. **Antigravity Fulfillment:** The user asks the Antigravity Assistant (me) in the chat window to "process the queue." I use my file-reading tools to grab the pending JSON requests, process the code logic using my `Gemini-3.1-Pro` capabilities, and use my execution tools to write the output exactly as structured JSON to `/tmp/req_{TIMESTAMP}_response.json`.
6. **Agent Resume:** `dev_graph.js` detects the newly created `_response.json` file, parses the Antigravity-provided content, resolves the LangGraph node promise, and moves to the next agent in the swarm.

## 3. Configuration & Resumption

### 3.1 Enabling/Disabling the Bridge
To make this configurable, you can toggle between the Bridge and the standard Google API in `dev_graph.js`.
```javascript
import { AntigravityBridgeLLM } from './AntigravityBridgeLLM.js';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';

const USE_BRIDGE = process.env.USE_ANTIGRAVITY_BRIDGE === 'true';

export const geminiPro = USE_BRIDGE 
  ? new AntigravityBridgeLLM({ model: "gemini-3.1-pro", temperature: 0.2 })
  : new ChatGoogleGenerativeAI({ model: "gemini-2.5-pro", apiKey: process.env.GEMINI_API_KEY });
```

### 3.2 Operating the Factory with the Bridge
When the bridge is enabled:
1. Run the factory: `node dev_graph.js <workspace>`
2. Tell the Antigravity assistant: *"The factory is running, please process the bridge queue."*
3. Antigravity will handle the heavy lifting while the background Node process routes the data.

## 4. Advantages
- Zero API credentials required on local environments.
- Leverages the massive capabilities of Gemini 3.1 Pro via Antigravity contexts.
- Extensively monitors LLM output, as the intermediate files can be debugged immediately out of `/tmp/`.
