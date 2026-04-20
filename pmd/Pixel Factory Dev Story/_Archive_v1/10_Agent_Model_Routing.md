# 10 - Implementation Detail: API Keys vs Model Definitions

## 1. Issue Addressed
Where precisely is the "intelligence level" (the specific LLM model) defined? Does generating a key from Google AI Studio hardcode you to a single model, or does the software control the routing?

## 2. The Distinction
Understanding the technical separation between Authentication and Parameter assignment is critical for multi-agent building.

### The API Key (The Authentication & Billing)
The API key (e.g., your Google AI Studio key or OpenAI key) is simply your **Authentication Badge and Wallet**. 
A single Google API key unlocks the entire family of Google Gemini models. The key itself has no concept of *which* model you are trying to use; it only exists to tell Google's servers, "Yes, this is an authorized user, and here is who you bill."

### The Software Definition (The Routing)
The actual selection of the "Model" happens locally within our Software Factory codebase (e.g., inside LangChain or Paperclip configurations).

When we write the configuration file for our Agents, we assign both variables simultaneously. 

## 3. Example Code Logic
Here is exactly how it looks when we construct the agents in code (Phase 3/4):

```javascript
// 1. We load the SINGLE key from your Admin UI
const GOOGLE_API_KEY = process.env.USER_PROVIDED_GEMINI_KEY;

// 2. We define Charlie (The Junior Dev)
const agentCharlie = new LangChainAgent({
    provider: "google",
    apiKey: GOOGLE_API_KEY,           // Authentication
    model: "gemini-1.5-flash",        // The Cheap, Fast Model
    role: "Junior CSS Engineer",
    systemPrompt: "You are an intern. Fix basic UI bugs."
});

// 3. We define Henry (The Senior Architect)
const agentHenry = new LangChainAgent({
    provider: "google",
    apiKey: GOOGLE_API_KEY,           // Exact Same Authentication Key
    model: "gemini-3.1-pro",          // The Expensive, Brilliant Model
    role: "Principal Staff Engineer",
    systemPrompt: "You are a senior auditor. Find severe memory leaks."
});
```

## 4. Architectural Summary
You provide the Factory with the Keys. The Factory logic (which we are programming) explicitly decides *which* model version to call through that key based on the difficulty of the task assigned.

---
**End of Document 10**
