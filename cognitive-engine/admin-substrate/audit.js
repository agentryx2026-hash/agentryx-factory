import fs from "node:fs/promises";
import path from "node:path";
import { REPO_ROOT } from "./registry.js";

const DEFAULT_AUDIT_PATH = path.join(REPO_ROOT, "_admin-audit.jsonl");

function auditPath() {
  return process.env.ADMIN_AUDIT_LOG || DEFAULT_AUDIT_PATH;
}

/**
 * Append one audit entry to the JSONL log.
 *
 * @param {Omit<import("./types.js").AuditEntry, "at">} partial
 */
export async function appendAudit(partial) {
  if (!partial?.actor) throw new Error("audit: actor required");
  if (!partial?.action) throw new Error("audit: action required");
  if (!partial?.target) throw new Error("audit: target required");
  const entry = { at: new Date().toISOString(), ...partial };
  await fs.appendFile(auditPath(), JSON.stringify(entry) + "\n", "utf-8");
  return entry;
}

/**
 * Read the audit log (most-recent first). Optionally filter by actor or action.
 */
export async function readAudit({ actor, action, target, limit = 100 } = {}) {
  let raw;
  try { raw = await fs.readFile(auditPath(), "utf-8"); }
  catch { return []; }
  if (!raw.trim()) return [];

  const all = raw.split("\n").filter(Boolean).map(l => JSON.parse(l));
  let filtered = all;
  if (actor) filtered = filtered.filter(e => e.actor === actor);
  if (action) filtered = filtered.filter(e => e.action === action);
  if (target) filtered = filtered.filter(e => e.target === target);
  return filtered.slice(-limit).reverse();
}

export function getAuditPath() { return auditPath(); }
