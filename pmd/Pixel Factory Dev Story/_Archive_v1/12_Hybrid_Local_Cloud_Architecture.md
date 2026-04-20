# 12 - Hybrid Architecture: Local OSS vs Cloud Specialists

## 1. The "Gold Standard" Architecture
The user proposed the industry "Gold Standard" for autonomous factories: a hybrid workforce. Instead of paying Google or Anthropic for every single line of code, the factory runs a vast fleet of entirely free, locally hosted Open-Source models (via Ollama or vLLM) that act as the bulk labor force. The orchestrator only wakes up the insanely expensive Cloud Specialists (Opus, Gemini 3.1 Pro, OpenAI o1) when the local models fail or face extreme complexity.

## 2. Most Capable Local Models for the Factory (Free Labor)
To run a capable local factory, the open-source community provides incredibly powerful, fine-tuned "interns":
* **DeepSeek Coder V2 / 3:** Arguably the most capable open-source codebase generator available. Exceedingly good at Python, TS, and React.
* **Qwen 2.5 Coder (72B):** Alibaba’s model that consistently matches GPT-4 on raw coding benchmarks.
* **Meta Llama 3.1 (70B / 400B):** Excellent generalist. Perfect for the "Alice" role (Triage, Issue translation, Management).
* **Mistral NeMo / Codestral:** Highly optimized for low-latency coding loops and unit testing.

## 3. Estimated Task Distribution Ratio (The 80/20 Rule)
Based on telemetry from live Autonomous Dev Factories, the estimated split is:

### 75% - 80% Local Free Agents (Boilerplate & Grunt Work)
Software engineering is surprisingly repetitive. The local open-source models will successfully complete ~80% of the volume.
* Writing unit tests and integration tests.
* Building standard React UI components from JSON specs.
* Fixing simple CSS alignment issues.
* Documenting existing code and generating `README` files.
* Routine dependency updates and simple package migrations.

### 20% - 25% Cloud Specialists (Architecture & Deep Reasoning)
The factory orchestrator will automatically escalate the ticket to the "Specialized Standby Team" (Gemini 3.1 Pro, Opus 4.6, OpenAI o1) when:
* **The "3-Strike" Rule:** If Charlie (Local Qwen) tries to compile a React component and gets an error 3 times in a row, Paperclip pulls Charlie off the task and wakes up Henry (Gemini 3.1 Pro).
* **Cryptic Debugging:** Fixing memory leaks or race conditions.
* **Core Architecture:** Designing the structure of a completely new microservice or refactoring a massive MongoDB schema where a 2,000,000 context window is required.
* **Final QA/Security:** You do not trust an open-source intern to sign off on security. "Ralph" (Claude Opus or Gemini) validates the final pull request before merge.

---
**End of Document 12**
