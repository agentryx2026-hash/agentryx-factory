// LangChain-compatible adapter so cognitive-engine graphs can swap
// `new ChatGoogleGenerativeAI({...})` → `new RouterChatModel({task: 'cheap'})`
// with no other changes.
//
// We don't extend LangChain's BaseChatModel class — that would couple us to
// LangChain internals. Instead we duck-type the surface that factory_graph.js
// actually uses (just .invoke()), which is what LangGraph nodes call too.
// Easy to extend later if .bindTools() / .withStructuredOutput() are needed.

import { complete } from './router.js';

export class RouterChatModel {
  constructor({ task, modelOverride = null, projectId = null, phase = null, agent = null } = {}) {
    if (!task) throw new Error('RouterChatModel: task is required (e.g. "architect", "code", "cheap")');
    this.task = task;
    this.modelOverride = modelOverride;
    this.projectId = projectId;
    this.phase = phase;
    this.agent = agent;
  }

  async invoke(messages, options = {}) {
    // Accept LangChain message instances OR plain {role, content} objects.
    const openaiMessages = (messages ?? []).map(toOpenAIMessage);

    const result = await complete({
      task: this.task,
      messages: openaiMessages,
      modelOverride: this.modelOverride,
      // Per-call attribution can override constructor defaults via options.config.
      projectId: options?.config?.projectId ?? this.projectId,
      phase:     options?.config?.phase     ?? this.phase,
      agent:     options?.config?.agent     ?? this.agent,
      signal:    options?.signal ?? null,
    });

    // Return a LangChain-shaped AIMessage. We don't import AIMessage from
    // @langchain/core to keep this module zero-dep — duck-typed object is fine
    // for `.content` reads. Node graph code does `response.content`, that's it.
    return {
      content: result.content,
      // Pass router metadata through so callers can introspect cost/latency.
      _meta: {
        model: result.model,
        backend: result.backend,
        cost_usd: result.cost_usd,
        latency_ms: result.latency_ms,
        usage: result.usage,
      },
    };
  }

  // LangChain's Runnable.invoke is the modern path; older code uses .call().
  // Alias for compat.
  async call(messages, options) { return this.invoke(messages, options); }

  // Identifier used by LangChain logging when present.
  _llmType() { return `agentryx-router:${this.task}`; }

  // Per-call task override without rebuilding the instance — useful when
  // the same model object handles multiple agent stages.
  withTask(task) {
    return new RouterChatModel({
      task,
      modelOverride: this.modelOverride,
      projectId: this.projectId,
      phase: this.phase,
      agent: this.agent,
    });
  }

  // Tag this instance with project/agent context so all .invoke() calls
  // carry it through to the cost telemetry. Returns a NEW instance.
  withContext({ projectId, phase, agent } = {}) {
    return new RouterChatModel({
      task: this.task,
      modelOverride: this.modelOverride,
      projectId: projectId ?? this.projectId,
      phase: phase ?? this.phase,
      agent: agent ?? this.agent,
    });
  }
}

// Convert LangChain HumanMessage / SystemMessage / AIMessage / ToolMessage into
// the OpenAI {role, content} shape the router speaks. Falls through plain objects.
function toOpenAIMessage(m) {
  // Plain object passthrough.
  if (m && typeof m === 'object' && typeof m.role === 'string' && typeof m.content === 'string') {
    return { role: m.role, content: m.content };
  }

  // LangChain class instance — detect by constructor name OR by `_getType()`.
  const type = (typeof m._getType === 'function' && m._getType())
            ?? (m?.constructor?.name?.replace(/Message$/, '').toLowerCase());

  let role;
  switch (type) {
    case 'system':  case 'SystemMessage':  role = 'system';    break;
    case 'human':   case 'HumanMessage':   role = 'user';      break;
    case 'ai':      case 'AIMessage':      role = 'assistant'; break;
    case 'tool':    case 'ToolMessage':    role = 'tool';      break;
    default:
      throw new Error(`RouterChatModel: cannot map message type "${type}" to OpenAI shape`);
  }

  // .content can be string or array-of-content-blocks. Stringify blocks for now;
  // multi-modal pass-through lands when we need it (vision tasks aren't in the
  // current factory pipeline).
  const content = typeof m.content === 'string'
    ? m.content
    : Array.isArray(m.content)
      ? m.content.map(b => (typeof b === 'string' ? b : b.text ?? '')).join('')
      : String(m.content ?? '');

  return { role, content };
}
