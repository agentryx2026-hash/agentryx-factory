// Genovi — the intake agent.
//
// Phase 3. Takes a raw scope document (SRS / FRS / PRD / TOR / plain text) and
// produces a structured requirements extraction + a rendered A0_Source_Analysis.md.
//
// Runs via the router's `task: 'intake'` tier — defaults to Gemini 2.5 Pro
// (long context, cheap structured output). Fallback chain per Phase 2 router.
//
// Public API:
//   runGenovi({ rawScopeText, projectId?, projectDir? })
//     → { extracted, markdown, usedModel, cost_usd, latency_ms }
//
// Usage inside pre_dev_graph.js (Phase 3-C):
//   async function genoviNode(state) {
//     const { extracted, markdown } = await runGenovi({
//       rawScopeText: state.userRequest,
//       projectId: state._projectDir,
//       projectDir: state._projectDir,
//     });
//     return { pmdDocs: { ...state.pmdDocs, A0_Source_Analysis: markdown, _raw_extraction: extracted } };
//   }

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { RouterChatModel } from '@agentryx-factory/llm-router';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SCHEMA_PATH = path.resolve(__dirname, 'schemas', 'requirements.schema.json');
const REQUIREMENTS_SCHEMA = JSON.parse(fs.readFileSync(SCHEMA_PATH, 'utf8'));

const SYSTEM_PROMPT = `You are Genovi, the intake-analysis agent for the Agentryx Dev Factory.

Your job: read a raw scope document (SRS / FRS / PRD / TOR / informal notes) and extract structured requirements suitable for downstream agents (Picard the architect, Sisko the planner, Troi the analyst).

You output VALID JSON ONLY — no prose wrapper, no markdown code fences, no explanation. The JSON must match the schema provided.

Principles:
- Prefer MoSCoW priorities (MUST/SHOULD/COULD/WILL_NOT). If the doc doesn't say, infer conservatively (default to SHOULD for nice-to-haves, MUST for anything the user explicitly said they need).
- Functional requirements: atomic, testable, actor-aware. Each must be something a tester could verify.
- Non-functional requirements: ALWAYS include at least performance, security, reliability if the doc hints at production-grade software.
- Open questions: if the doc is ambiguous on critical points, DO NOT fill in — surface as an open question. The factory has a verify portal (Phase 9) where humans answer these.
- Estimated complexity: be honest. If scope is genuinely XL, say so.
- Tech stack hints: OPTIONAL. If the user named technologies, echo them. Do not add your own preferences unless the doc asked for recommendations.

Remember: your output is consumed machine-first. Human-readability comes from the downstream renderer.`;

// A concrete worked example. LLMs copy the structure they see — giving them
// an example with exact field names produces far more reliable output than
// abstract schema descriptions.
const EXAMPLE_OUTPUT = {
  project_summary: "A web-based expense tracker for small businesses that syncs with bank feeds and generates monthly reports.",
  domain: "finance",
  primary_actors: ["business owner", "accountant", "auditor"],
  functional_requirements: [
    { id: "FR-001", priority: "MUST", description: "Users can import transactions from a CSV file.", actor: "business owner" },
    { id: "FR-002", priority: "MUST", description: "System generates a monthly PDF report.", actor: "accountant" },
    { id: "FR-003", priority: "SHOULD", description: "Audit trail logs every edit to a transaction.", actor: "auditor" }
  ],
  non_functional_requirements: [
    { category: "security", description: "All data encrypted at rest.", target_metric: "AES-256" },
    { category: "performance", description: "Import completes within 10s for 10,000 rows." }
  ],
  constraints: ["Must run on AWS", "Budget: $20k/year"],
  assumptions: ["Users have modern browsers", "Internet connection available"],
  acceptance_criteria: ["Admin can import 1000 txns without error", "Monthly PDF renders within 5s"],
  open_questions: ["Which bank feed provider?", "SSO required?"],
  scope_exclusions: ["Tax filing integration", "Multi-currency"],
  estimated_complexity: "medium",
  recommended_tech_stack_hints: ["PostgreSQL for audit log", "Playwright for PDF rendering"]
};

function buildExtractionPrompt(rawScopeText) {
  return `Produce a JSON object with EXACTLY these fields (same names, same types, same enum values):

\`\`\`json
${JSON.stringify(EXAMPLE_OUTPUT, null, 2)}
\`\`\`

Rules:
- Field names MUST match exactly: \`id\` (not \`requirement_id\`), \`priority\` (MUST/SHOULD/COULD/WILL_NOT), \`description\`.
- \`domain\` MUST be one of: e-commerce, finance, healthcare, education, devtools, saas-b2b, saas-b2c, gaming, media, gov-public, logistics, iot-industrial, ai-ml-ops, other.
- \`estimated_complexity\` MUST be one of: small, medium, large, xl.
- \`primary_actors\` is a list of STRINGS (role names), not objects.
- IDs follow format \`FR-001\`, \`FR-002\`, ... (not \`FR001\` or \`F001\`).
- Output RAW JSON only — no markdown fences, no explanation text.

RAW SCOPE DOCUMENT:
---
${rawScopeText}
---

Output the JSON now:`;
}

// ─── Parse + validate ─────────────────────────────────────────────────────

function parseAndValidate(text) {
  // Strip markdown code fences if the model added them despite our instructions.
  const stripped = text
    .replace(/^```(?:json)?\s*\n?/i, '')
    .replace(/\n?```\s*$/i, '')
    .trim();

  let parsed;
  try {
    parsed = JSON.parse(stripped);
  } catch (err) {
    throw new Error(`Genovi: LLM returned non-JSON. First 200 chars: ${stripped.slice(0, 200)}... (parse error: ${err.message})`);
  }

  // Lightweight validation — don't pull a full JSON schema validator dep for v0.0.1.
  // Just check the required fields + some basic shape.
  for (const key of REQUIREMENTS_SCHEMA.required) {
    if (parsed[key] === undefined || parsed[key] === null) {
      throw new Error(`Genovi: extraction missing required field "${key}"`);
    }
  }
  if (!Array.isArray(parsed.functional_requirements) || parsed.functional_requirements.length === 0) {
    throw new Error('Genovi: functional_requirements must be a non-empty array');
  }
  for (const fr of parsed.functional_requirements) {
    if (!fr.id || !fr.priority || !fr.description) {
      throw new Error(`Genovi: a functional_requirement is missing id/priority/description: ${JSON.stringify(fr).slice(0, 200)}`);
    }
  }

  return parsed;
}

// ─── Markdown renderer ────────────────────────────────────────────────────

function renderA0Markdown(extracted, meta = {}) {
  const {
    project_summary,
    domain,
    primary_actors,
    functional_requirements,
    non_functional_requirements = [],
    constraints = [],
    assumptions = [],
    acceptance_criteria = [],
    open_questions = [],
    scope_exclusions = [],
    estimated_complexity,
    recommended_tech_stack_hints = [],
  } = extracted;

  const frTable = functional_requirements
    .map((fr) => `| ${fr.id} | ${fr.priority} | ${fr.actor || '—'} | ${escapeCell(fr.description)} |`)
    .join('\n');

  const nfrBySection = non_functional_requirements.reduce((acc, nfr) => {
    (acc[nfr.category] ??= []).push(nfr);
    return acc;
  }, {});
  const nfrBlocks = Object.entries(nfrBySection)
    .map(([cat, items]) =>
      `### ${capitalize(cat)}\n${items
        .map((nfr) => `- ${nfr.description}${nfr.target_metric ? ` *(target: ${nfr.target_metric})*` : ''}`)
        .join('\n')}`
    )
    .join('\n\n');

  const bulletList = (arr) => (arr.length ? arr.map((x) => `- ${x}`).join('\n') : '_(none)_');
  const checklist = (arr) => (arr.length ? arr.map((x) => `- [ ] ${x}`).join('\n') : '_(none)_');

  const generatedAt = new Date().toISOString();
  const model = meta.model || 'unknown';
  const cost = meta.cost_usd != null ? `$${meta.cost_usd.toFixed(6)}` : 'unknown';

  return `# A0 — Source Analysis

> **Generated by Genovi** (intake agent) on ${generatedAt}
> Model: \`${model}\` · Cost: ${cost}
> Schema: \`cognitive-engine/schemas/requirements.schema.json\`

## Project Summary

${project_summary}

**Domain:** ${domain} · **Complexity:** ${estimated_complexity}

## Primary Actors

${primary_actors.map((a) => `- ${a}`).join('\n')}

## Functional Requirements

| ID | Priority | Actor | Description |
|---|---|---|---|
${frTable}

## Non-Functional Requirements

${nfrBlocks || '_(none extracted)_'}

## Constraints

${bulletList(constraints)}

## Assumptions

${bulletList(assumptions)}

## Acceptance Criteria

${checklist(acceptance_criteria)}

## Scope Exclusions

${bulletList(scope_exclusions)}

## Open Questions

${open_questions.length
    ? open_questions.map((q) => `- ⚠️ ${q}`).join('\n')
    : '_(none — document appears complete)_'}

${recommended_tech_stack_hints.length
    ? `## Tech-Stack Hints\n\n${bulletList(recommended_tech_stack_hints)}\n\n_These are Genovi's echoes of what the source doc mentioned; Picard will decide the actual A2 architecture._`
    : ''}

---

*Raw JSON extraction available under \`state.pmdDocs._raw_extraction\` for downstream agents. Picard reads this A0 first to architect the solution (A1 Brief, A2 Architecture, ...).*
`;
}

function escapeCell(s) {
  return String(s || '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
}
function capitalize(s) {
  return String(s || '').charAt(0).toUpperCase() + String(s || '').slice(1);
}

// ─── Main entry point ─────────────────────────────────────────────────────

export async function runGenovi({ rawScopeText, projectId = null, projectDir = null } = {}) {
  if (!rawScopeText || typeof rawScopeText !== 'string' || rawScopeText.trim().length === 0) {
    throw new Error('runGenovi: rawScopeText required (non-empty string)');
  }

  const model = new RouterChatModel({
    task: 'intake',
    projectId,
    phase: 'pre-dev',
    agent: 'genovi',
  });

  const t0 = Date.now();
  const response = await model.invoke([
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user',   content: buildExtractionPrompt(rawScopeText) },
  ]);
  const latency_ms = Date.now() - t0;

  let extracted;
  try {
    extracted = parseAndValidate(response.content);
  } catch (err) {
    // Surface the raw response in the error so callers can debug.
    err.rawResponse = response.content;
    err.model = response._meta?.model;
    throw err;
  }

  const markdown = renderA0Markdown(extracted, {
    model: response._meta?.model,
    cost_usd: response._meta?.cost_usd,
  });

  // If a project dir was provided, write A0_Source_Analysis.md to it.
  if (projectDir) {
    const pmdDir = path.join(projectDir, 'PMD');
    fs.mkdirSync(pmdDir, { recursive: true });
    fs.writeFileSync(path.join(pmdDir, 'A0_Source_Analysis.md'), markdown);
  }

  return {
    extracted,
    markdown,
    usedModel: response._meta?.model,
    cost_usd: response._meta?.cost_usd,
    latency_ms,
  };
}

// Exported for testing
export { parseAndValidate, renderA0Markdown, buildExtractionPrompt };
