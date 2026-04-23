/**
 * Admin substrate — types and role hierarchy.
 *
 * Implements the data model side of the B7 Admin & Operations Module spec.
 * HTTP wiring is deferred to Phase 12-B.
 */

/**
 * @typedef {"super_admin"|"admin"|"operator"|"viewer"} Role
 */

export const ROLE_RANK = Object.freeze({
  super_admin: 3,
  admin: 2,
  operator: 1,
  viewer: 0,
});

export const ROLES = Object.freeze(Object.keys(ROLE_RANK));

/**
 * @typedef {Object} ConfigEntry
 * @property {string} id                          stable identifier, e.g. "cost_thresholds"
 * @property {string} display_name
 * @property {string} description
 * @property {string} path                        absolute or repo-relative file path
 * @property {string} category                    "feature_flags" | "routing" | "pricing" | "registry" | etc.
 * @property {Role} min_role_view                 role required to view
 * @property {Role} min_role_edit                 role required to edit
 * @property {boolean} sensitive                  if true, value masked when listed
 * @property {number} [schema_version]
 */

/**
 * @typedef {Object} FeatureFlag
 * @property {string} env_var                     e.g. "USE_MCP_TOOLS"
 * @property {string} display_name
 * @property {string} description
 * @property {string} owning_phase                e.g. "Phase 5-A"
 * @property {"on"|"off"|"auto"} default_when_unset
 */

/**
 * @typedef {Object} AuditEntry
 * @property {string} at                          ISO 8601 UTC
 * @property {string} actor                       e.g. nginx X-Remote-User
 * @property {string} action                      e.g. "config.update", "flag.read", "role.deny"
 * @property {string} target                      e.g. "cost_thresholds", "USE_MCP_TOOLS"
 * @property {Record<string, any>} [meta]
 * @property {boolean} [denied]                   true if this was a denied access attempt
 */

export const SCHEMA_VERSION = 1;

export const CONFIG_CATEGORIES = Object.freeze([
  "feature_flags",
  "routing",
  "pricing",
  "registry",
  "thresholds",
  "providers",
  "mcp",
]);

export function isValidRole(r) { return ROLES.includes(r); }

export function isValidCategory(c) { return CONFIG_CATEGORIES.includes(c); }

export function validateRoleOrThrow(r) {
  if (!isValidRole(r)) throw new Error(`unknown role: ${r}`);
}
