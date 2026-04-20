# 16 - Diana's Video Pipeline: Zero-Cost Automated Walkthrough Videos

## 1. Issue Addressed
Instead of paying for expensive AI video generation platforms (HeyGen at ~$30/month, Synthesia at ~$90/month), can Diana use OpenClaw + free local tools to physically navigate the deployed application, record her screen, and produce walkthrough videos identical to the user's reference (How_To_use.mp4)?

## 2. Answer: Absolutely Yes
This is arguably the single most powerful capability of the OpenClaw execution sandbox. OpenClaw can control a real browser (via Playwright/Puppeteer), which means Diana can literally:
1. Open Chrome.
2. Navigate to `https://your-deployed-app.com`.
3. Click buttons, fill forms, scroll pages—exactly like a human would.
4. While doing so, a screen recorder (FFmpeg or RecordMyDesktop) captures every pixel.

The output is a real `.mp4` video showing real mouse movements on a real browser. **Zero AI video generation cost. Zero HeyGen. Zero Synthesia.**

## 3. The Technical Pipeline (Diana's Video Assembly Line)

### Step 1: Diana Generates a Test Script (LLM Task)
Diana reads the merged codebase and the user manual she already wrote. She outputs a structured JSON "screenplay":
```json
{
  "title": "How To Use the Homestay Portal",
  "steps": [
    { "action": "navigate", "target": "https://app.example.com/login" },
    { "action": "type", "selector": "#email", "value": "demo@example.com" },
    { "action": "type", "selector": "#password", "value": "demo123" },
    { "action": "click", "selector": "#login-btn", "waitMs": 2000 },
    { "action": "click", "selector": ".nav-bookings", "waitMs": 1500 },
    { "action": "scroll", "direction": "down", "amount": 300 },
    { "action": "click", "selector": ".booking-card:first-child", "waitMs": 2000 }
  ]
}
```

### Step 2: OpenClaw Executes the Screenplay (Execution Layer)
OpenClaw spins up a headless (or headed) Chromium browser via Playwright. It reads Diana's JSON and physically performs each action:
```javascript
const { chromium } = require('playwright');

async function recordWalkthrough(screenplay) {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    recordVideo: { dir: './output-videos/', size: { width: 1920, height: 1080 } }
  });
  const page = await context.newPage();

  for (const step of screenplay.steps) {
    if (step.action === 'navigate') await page.goto(step.target);
    if (step.action === 'type') await page.fill(step.selector, step.value);
    if (step.action === 'click') await page.click(step.selector);
    if (step.action === 'scroll') await page.mouse.wheel(0, step.amount);
    if (step.waitMs) await page.waitForTimeout(step.waitMs);
  }

  await context.close(); // This saves the .webm video
  await browser.close();
}
```
**Playwright has built-in video recording.** No FFmpeg configuration needed. It literally outputs a `.webm` file of the entire browser session including all mouse movements and page transitions.

### Step 3: Post-Processing (Optional Enhancements)
* **Convert to MP4:** `ffmpeg -i output.webm -c:v libx264 walkthrough.mp4`
* **Add Text Overlays:** FFmpeg can burn step annotations ("Step 1: Click Login") onto the video frames.
* **Add Voiceover (Free):** Pipe Diana's step descriptions into a free local TTS engine (like Piper TTS or Coqui TTS) to generate an audio narration track, then mux it into the MP4.

## 4. Cost Analysis
| Component | Tool | Cost |
|---|---|---|
| Script Generation | Diana (Local Qwen/Llama) | $0.00 |
| Browser Automation | Playwright (OSS) | $0.00 |
| Screen Recording | Playwright built-in | $0.00 |
| Video Conversion | FFmpeg (OSS) | $0.00 |
| Voiceover (Optional) | Piper TTS (OSS) | $0.00 |
| **Total** | | **$0.00** |

## 5. Conclusion
Diana does not need HeyGen. She does not need Synthesia. She uses OpenClaw to physically drive a real browser, Playwright records every frame, and FFmpeg packages the result. The output is indistinguishable from a human recording a screen walkthrough. Total infrastructure cost: zero.

---
**End of Document 16**
