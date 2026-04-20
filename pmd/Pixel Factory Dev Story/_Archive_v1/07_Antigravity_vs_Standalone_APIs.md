# 07 - API Provisioning: Platform Credits vs Standalone Infrastructure

## 1. Issue Addressed
Can internal Integrated Development Environment (IDE) AI credits (like those used by Antigravity) be exported to fuel external autonomous agents like OpenClaw and Paperclip?

## 2. Infrastructure Distinction
There are two completely separate channels of AI usage at play in this Software Development lifecycle:

* **Channel A: Antigravity IDE Credits (Internal Platform)**
  * The credits and quotas shown in the IDE settings (e.g., 24,975 AI Credits, Gemini 3.1 Pro Quota) are locked strictly to the Antigravity assistant system. 
  * They fuel *this* conversation. They are paid to the IDE provider to allow the built-in AI to analyze workspaces, generate code, and answer questions. These credits **cannot** be exported into a raw API string.

* **Channel B: Google AI Studio (External Infrastructure)**
  * The API key generated at `aistudio.google.com` (e.g., for the "SW DEV Factory" project) is a raw, standalone infrastructure key provided directly by Google.
  * OpenClaw and Paperclip are external standalone applications running on your machine. They have no knowledge of the Antigravity IDE. Thus, to give them a "brain", they must rely purely on the raw Channel B API keys.

## 3. Conclusion
The Software Factory will use the standalone API Key generated from Google AI Studio (Channel B). The Antigravity IDE credits (Channel A) will remain exclusively for the human-AI pair programming occurring in the overarching terminal session.

---
**End of Document 07**
