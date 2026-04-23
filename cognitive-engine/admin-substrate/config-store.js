import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { getConfigEntry } from "./registry.js";

/**
 * Read a config entry by id. Returns parsed JSON + entry metadata.
 *
 * @param {string} id
 * @returns {Promise<{entry: import("./types.js").ConfigEntry, value: any}>}
 */
export async function readConfig(id) {
  const entry = getConfigEntry(id);
  if (!entry) throw new Error(`unknown config id: ${id}`);
  const raw = await fs.readFile(entry.path, "utf-8");
  const value = JSON.parse(raw);
  return { entry, value };
}

/**
 * Atomic write: write to a temp sibling file, then rename. Prevents
 * corrupted JSON if the process is killed mid-write.
 *
 * Validates schema_version match if the entry declares one.
 *
 * @param {string} id
 * @param {any} value          new full config object
 */
export async function writeConfig(id, value) {
  const entry = getConfigEntry(id);
  if (!entry) throw new Error(`unknown config id: ${id}`);
  if (entry.schema_version != null && value && typeof value === "object") {
    if (typeof value.schema_version !== "number") {
      throw new Error(`config ${id} requires schema_version (expected ${entry.schema_version})`);
    }
    if (value.schema_version !== entry.schema_version) {
      throw new Error(`config ${id} schema_version mismatch: file ${value.schema_version} vs registry ${entry.schema_version}`);
    }
  }
  const serialized = JSON.stringify(value, null, 2) + "\n";
  const tmpPath = entry.path + ".tmp." + crypto.randomBytes(4).toString("hex");
  await fs.writeFile(tmpPath, serialized, "utf-8");
  await fs.rename(tmpPath, entry.path);
  return {
    ok: true,
    bytes: Buffer.byteLength(serialized, "utf-8"),
    sha256: crypto.createHash("sha256").update(serialized).digest("hex"),
  };
}

/**
 * Snapshot helper for diff-based admin UI. Returns the file's current bytes + sha.
 */
export async function snapshotConfig(id) {
  const entry = getConfigEntry(id);
  if (!entry) throw new Error(`unknown config id: ${id}`);
  const raw = await fs.readFile(entry.path, "utf-8");
  return {
    id,
    path: entry.path,
    bytes: Buffer.byteLength(raw, "utf-8"),
    sha256: crypto.createHash("sha256").update(raw).digest("hex"),
    updated_at: (await fs.stat(entry.path)).mtime.toISOString(),
  };
}
