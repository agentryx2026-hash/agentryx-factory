# 15 - Expanding the Roster: E2E Automation and Product Marketing

## 1. Issue Addressed
The user correctly identified severe bottlenecks in the standard 5-Agent agile squad. 
1. **Testing:** "Ralph" the QA Auditor only *reads* code for security flaws. We lack a dedicated Software Development Engineer in Test (SDET) to write and execute physical Playwright/Jest testing scripts.
2. **Go-To-Market (GTM):** The factory produces code, but lacks an agent to convert that code into user manuals, marketing copy, and training video scripts.

## 2. The Two New Agents

### Agent 6: The SDET / Automation Engineer ("Tara")
* **Role:** Exhaustive E2E and Unit Testing.
* **Responsibilities:** Tara sits directly between Charlie (Junior Dev) and Ralph (Security QA). Whenever Charlie finishes an app feature, Tara’s only job is to write exhaustive `Vitest` or `Playwright` testing suites for it. She then actually runs the tests in the OpenClaw terminal. If they break, she sends the error log back to Charlie. Charlie is not allowed to submit his PR until Tara's tests pass 100%.
* **Model Profile:** `gemini-1.5-pro` or `qwen-2.5-coder`. Needs strong logical execution but not expensive architectural intuition.

### Agent 7: Technical Writer & Go-To-Market ("Diana")
* **Role:** Documentation, Marketing, and Media Scripts.
* **Responsibilities:** Once the software merges to the `main` branch, Diana wakes up. She is given the entire merged codebase via the massive context window. 
   - She generates the `README.md` and user manual.
   - She writes SEO-optimized marketing copy for the product launch.
   - **Video Training:** She generates step-by-step UI scripts (e.g., "Click the blue button in the top left"). In an advanced pipeline, her JSON output can be piped directly into a text-to-video API (like HeyGen or Synthesia) to literally auto-generate the onboarding video.
* **Model Profile:** `gemini-1.5-pro` (or Claude 3.5 Sonnet). Needs exceptional natural language processing and creative writing skills, but does not need to be a top-tier coder.

## 3. The 7-Agent Assembly Line
The new pipeline flows as follows:
Alice (Triage) -> Charlie/Henry (Code) -> **Tara (E2E Tests)** -> Ralph (Security Review) -> OpsBot (Deploy) -> **Diana (Docs & Marketing output)**.

---
**End of Document 15**
