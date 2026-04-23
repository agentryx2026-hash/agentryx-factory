import { ROLE_RANK, ROLES } from "./types.js";

/**
 * Returns true iff role A has at least as much privilege as role B.
 * Use for "actor must be ≥ X to do Y" checks.
 */
export function roleMeets(actorRole, requiredRole) {
  const a = ROLE_RANK[actorRole];
  const r = ROLE_RANK[requiredRole];
  if (a == null) return false;
  if (r == null) return false;
  return a >= r;
}

/**
 * Throw if actor doesn't meet required role. Returns void on success so call
 * sites read like assertions.
 */
export function requireRole(actorRole, requiredRole, action = "this action") {
  if (!roleMeets(actorRole, requiredRole)) {
    const e = new Error(`role ${actorRole || "unknown"} cannot perform ${action} (requires ${requiredRole})`);
    e.code = "ROLE_FORBIDDEN";
    e.required = requiredRole;
    e.actual = actorRole;
    throw e;
  }
}

export function listRoles() {
  return ROLES.slice();
}

export function rankOf(role) {
  return ROLE_RANK[role] ?? -1;
}
