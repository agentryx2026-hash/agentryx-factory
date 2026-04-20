# 05 - The Visual Telemetry Layer (Custom React App)

## 1. Overview
The final touch of the "Pixel Factory" is the visual dashboard. The OpenClaw agents execute tasks in the background terminal, emitting status JSON objects. The user required a custom, high-end, gamified UI equivalent to a physical "factory floor" to observe these agents, as well as an Admin settings page to hot-swap out cognitive engines (Gemini, Claude, DeepSeek).

## 2. Technical Stack
* **Framework:** Vite + React + TypeScript.
* **Styling Engine:** Vanilla CSS, heavily utilizing CSS Modules and global CSS variables for a "Glassmorphism" Dark Theme.
* **Component Paradigm:** Fully stateless visual components (awaiting the WebSocket integration from Paperclip in the next phase). 

## 3. UI Structure
1. **The Navigation Sidebar:** To route between "Factory Floor" and "Settings".
2. **The "Factory Floor" Interactive Grid:** A mapped CSS coordinate system containing standard agent zones (`Break Room`, `Triage`, `Build Sandbox`, `QA`, `Deploy/Ship`).
3. **The Configuration / Admin Settings:** A centralized interface managing the API keys for all open-source and proprietary models. 

## 4. Execution State
The foundational React shell has been scaffolded at `~/Projects/pixel-factory-ui`. We are now actively writing the root component structures and the overarching styling system to create that visually stunning "easy on the eyes" experience.

---
**End of Document 05**
