import { FEATURE_FLAGS, getFeatureFlag } from "./registry.js";

/**
 * Read current process.env value for a flag (returns "on"/"off"/null-if-unset).
 * "on" means env value is truthy after lowercasing: "true", "1", "on", "yes", "y".
 */
export function readFlag(envVar) {
  const v = process.env[envVar];
  if (v == null) return null;
  return /^(true|1|on|yes|y)$/i.test(String(v).trim()) ? "on" : "off";
}

/**
 * Snapshot all known flags + current values.
 *
 * @returns {Array<{flag: import("./types.js").FeatureFlag, current: string|null, effective: "on"|"off"}>}
 */
export function snapshotAllFlags() {
  return FEATURE_FLAGS.map(flag => {
    const current = readFlag(flag.env_var);
    let effective;
    if (current != null) {
      effective = current;
    } else {
      effective = flag.default_when_unset === "on" ? "on" : "off";
    }
    return { flag, current, effective };
  });
}

export function listFlagEnvVars() {
  return FEATURE_FLAGS.map(f => f.env_var);
}

export function isKnownFlag(envVar) {
  return getFeatureFlag(envVar) != null;
}
