# 09 - Factory workforce Strategy: Roles, Responsibilities, and "Salaries"

## 1. Issue Addressed
How do we balance the immense capability of high-end LLM APIs with the exponential cost of running autonomous coding loops?

## 2. The Solution: A Hierarchical Workforce
The user perfectly identified the most effective strategy for building an AI Factory: **You treat the APIs exactly like a human organization.**

If you hire a Senior Staff Engineer (earning $400k/year), you do not ask them to format your resume or organize meeting notes. You hire an intern or an administrative assistant for that. 

The Autonomous Factory uses this exact economic model via **Agent Routing**:

1. **The Triage Agent (The "Intern" / Free):**
   * **Task:** Reads incoming Jira tickets, categorizes them (Bug vs Feature), and routes them to the correct department.
   * **Model Used:** A free local model (like Llama 3 via Ollama) or a practically free API (like Gemini 1.5 Flash).
   * **"Salary" (Cost):** ~$0.00 / hour.

2. **The Junior Developer (Mid-Range):**
   * **Task:** Writes basic boilerplate code, simple CSS fixes, or simple unit tests.
   * **Model Used:** Gemini 1.5 Pro or Claude 3.5 Haiku.
   * **"Salary" (Cost):** ~$0.10 / task.

3. **The Senior Architect / Staff Engineer (High-End):**
   * **Task:** Reviews Pull Requests for security flaws, designs complex database schemas, and debugs cryptic core-logic errors.
   * **Model Used:** Claude 4.6 Opus, Gemini 3.1 Pro (High), or OpenAI o1-preview.
   * **"Salary" (Cost):** ~$5.00+ / complex reasoning session.

## 3. Implementation in Paperclip
Paperclip's orchestration engine excels at this exact routing. 
Within the Paperclip configuration files, we will explicitly define an array of `Agents`. Each agent object will hardcode the specific `model` parameter, ensuring that "Charlie the UI Dev" never accidentally spins up the hyper-expensive `gemini-3.1-pro` model unless explicitly escalated by the `Senior Reviewer`.

This prevents catastrophic "runaway API bills" while maintaining peak performance only where it is strictly required.

---
**End of Document 09**
