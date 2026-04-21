// Phase 2.5-A — encrypted provider-key store.
//
// Contracts:
//   getKey(provider)     → string | null   (decrypts; returns null if missing/disabled)
//   setKey(provider, plaintext, opts)      (encrypt + INSERT or UPDATE; logs audit)
//   listKeys()           → array of masked metadata, NEVER plaintext
//   toggleKey(provider, enabled)           (sets enabled flag; logs audit)
//   deleteKey(provider)                    (removes row; logs audit)
//   touchLastUsed(provider)                (router updates last_used_at — fire-and-forget)
//
// Decryption requires the master key at ~/.config/factory-master-key. Without
// it, getKey() returns null (graceful degrade — system uses env-var fallback).

import crypto from 'node:crypto';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { Pool } from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const ALG = 'aes-256-gcm';
const IV_LEN = 12;
const TAG_LEN = 16;

const DEFAULT_DB_URL = 'postgres://factory:factory_dev_2026@localhost:5432/pixel_factory';
const MASTER_KEY_PATH = process.env.FACTORY_MASTER_KEY_PATH
  || resolve(process.env.HOME || '/home/subhash.thakur.india', '.config', 'factory-master-key');

let _pool = null;
let _master = null;
let _masterErr = null;

function getPool() {
  if (_pool) return _pool;
  _pool = new Pool({
    connectionString: process.env.LLM_ROUTER_DB_URL || DEFAULT_DB_URL,
    max: 4,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 2_000,
  });
  _pool.on('error', (err) => process.stderr.write(`KEYS_POOL_ERR ${err.message}\n`));
  return _pool;
}

function loadMaster() {
  if (_master) return _master;
  if (_masterErr) return null;
  try {
    const raw = fs.readFileSync(MASTER_KEY_PATH, 'utf8').trim();
    const decoded = Buffer.from(raw, 'base64');
    if (decoded.length !== 32) {
      throw new Error(`master key wrong length: expected 32 bytes after base64 decode, got ${decoded.length}`);
    }
    _master = decoded;
    return _master;
  } catch (err) {
    _masterErr = err;
    process.stderr.write(`KEYS_MASTER_ERR ${err.message} (path: ${MASTER_KEY_PATH})\n`);
    return null;
  }
}

// Generate a fresh master key — called by setup scripts (deploy/restore.sh)
// when no key exists. Does NOT overwrite an existing key.
export function generateMasterKey() {
  if (fs.existsSync(MASTER_KEY_PATH)) {
    return { created: false, path: MASTER_KEY_PATH };
  }
  const key = crypto.randomBytes(32);
  fs.mkdirSync(dirname(MASTER_KEY_PATH), { recursive: true, mode: 0o700 });
  fs.writeFileSync(MASTER_KEY_PATH, key.toString('base64'), { mode: 0o600 });
  return { created: true, path: MASTER_KEY_PATH };
}

function encrypt(plaintext) {
  const master = loadMaster();
  if (!master) throw new Error('master key unavailable — cannot encrypt');
  const iv = crypto.randomBytes(IV_LEN);
  const cipher = crypto.createCipheriv(ALG, master, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const auth_tag = cipher.getAuthTag();
  return { ciphertext, iv, auth_tag };
}

function decrypt({ ciphertext, iv, auth_tag }) {
  const master = loadMaster();
  if (!master) return null;
  try {
    const decipher = crypto.createDecipheriv(ALG, master, iv);
    decipher.setAuthTag(auth_tag);
    const plain = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return plain.toString('utf8');
  } catch (err) {
    process.stderr.write(`KEYS_DECRYPT_ERR provider decrypt failed: ${err.message}\n`);
    return null;
  }
}

// ─── Public API ────────────────────────────────────────────────────────────

let _cache = new Map();   // provider → { value, expiresAt }
const CACHE_TTL_MS = 60_000;

export async function getKey(provider) {
  // 60s in-memory cache — limits decrypt CPU on hot paths.
  const cached = _cache.get(provider);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  const pool = getPool();
  let row;
  try {
    const { rows } = await pool.query(
      `SELECT ciphertext, iv, auth_tag, enabled
         FROM provider_keys
        WHERE provider = $1`,
      [provider]
    );
    row = rows[0];
  } catch (err) {
    process.stderr.write(`KEYS_QUERY_ERR getKey(${provider}): ${err.message}\n`);
    return null;
  }

  if (!row || !row.enabled) {
    _cache.set(provider, { value: null, expiresAt: Date.now() + CACHE_TTL_MS });
    return null;
  }

  const value = decrypt(row);
  _cache.set(provider, { value, expiresAt: Date.now() + CACHE_TTL_MS });
  return value;
}

export async function setKey(provider, plaintext, opts = {}) {
  if (!provider || typeof provider !== 'string') throw new Error('setKey: provider required');
  if (!plaintext || typeof plaintext !== 'string') throw new Error('setKey: plaintext required');

  const { ciphertext, iv, auth_tag } = encrypt(plaintext);
  const prefix = plaintext.slice(0, 12);
  const suffix = plaintext.slice(-4);
  const length = plaintext.length;
  const actor = opts.actor || 'unknown';
  const label = opts.label || null;

  const pool = getPool();
  const exists = await pool.query(`SELECT id FROM provider_keys WHERE provider = $1`, [provider]);
  const action = exists.rows.length > 0 ? 'update' : 'create';

  await pool.query(
    `INSERT INTO provider_keys (provider, key_label, ciphertext, iv, auth_tag, key_prefix, key_suffix, key_length, enabled, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, now())
     ON CONFLICT (provider) DO UPDATE SET
       key_label = EXCLUDED.key_label,
       ciphertext = EXCLUDED.ciphertext,
       iv = EXCLUDED.iv,
       auth_tag = EXCLUDED.auth_tag,
       key_prefix = EXCLUDED.key_prefix,
       key_suffix = EXCLUDED.key_suffix,
       key_length = EXCLUDED.key_length,
       enabled = true,
       updated_at = now()`,
    [provider, label, ciphertext, iv, auth_tag, prefix, suffix, length]
  );

  await pool.query(
    `INSERT INTO key_audit_log (actor, action, provider, details)
     VALUES ($1, $2, $3, $4)`,
    [actor, action, provider, JSON.stringify({ prefix, length, label })]
  );

  _cache.delete(provider);
  return { provider, action, prefix, length };
}

export async function listKeys() {
  const pool = getPool();
  const { rows } = await pool.query(
    `SELECT provider, key_label, key_prefix, key_suffix, key_length, enabled,
            created_at, updated_at, last_used_at, notes
       FROM provider_keys
      ORDER BY provider`
  );
  // NEVER include ciphertext/iv/auth_tag — even authorized API/UI users only see masked.
  return rows.map(r => ({
    provider: r.provider,
    label: r.key_label,
    masked: r.key_prefix && r.key_suffix ? `${r.key_prefix}…${r.key_suffix}` : null,
    length: r.key_length,
    enabled: r.enabled,
    created_at: r.created_at,
    updated_at: r.updated_at,
    last_used_at: r.last_used_at,
    notes: r.notes,
  }));
}

export async function toggleKey(provider, enabled, opts = {}) {
  const pool = getPool();
  const result = await pool.query(
    `UPDATE provider_keys SET enabled = $2, updated_at = now() WHERE provider = $1 RETURNING enabled`,
    [provider, !!enabled]
  );
  if (result.rowCount === 0) return null;

  await pool.query(
    `INSERT INTO key_audit_log (actor, action, provider, details)
     VALUES ($1, $2, $3, $4)`,
    [opts.actor || 'unknown', enabled ? 'toggle_on' : 'toggle_off', provider, JSON.stringify({})]
  );

  _cache.delete(provider);
  return { provider, enabled: result.rows[0].enabled };
}

export async function deleteKey(provider, opts = {}) {
  const pool = getPool();
  const result = await pool.query(`DELETE FROM provider_keys WHERE provider = $1`, [provider]);
  if (result.rowCount === 0) return false;

  await pool.query(
    `INSERT INTO key_audit_log (actor, action, provider, details)
     VALUES ($1, 'delete', $2, $3)`,
    [opts.actor || 'unknown', provider, JSON.stringify({})]
  );

  _cache.delete(provider);
  return true;
}

// Fire-and-forget — router calls this after every successful LLM call. Never throws.
export function touchLastUsed(provider) {
  const pool = getPool();
  pool.query(
    `UPDATE provider_keys SET last_used_at = now() WHERE provider = $1`,
    [provider]
  ).catch(err => process.stderr.write(`KEYS_TOUCH_ERR ${provider}: ${err.message}\n`));
}

export async function getAuditLog({ provider = null, limit = 100 } = {}) {
  const pool = getPool();
  const sql = provider
    ? `SELECT id, ts, actor, action, provider, details FROM key_audit_log WHERE provider = $1 ORDER BY ts DESC LIMIT $2`
    : `SELECT id, ts, actor, action, provider, details FROM key_audit_log ORDER BY ts DESC LIMIT $1`;
  const args = provider ? [provider, limit] : [limit];
  const { rows } = await pool.query(sql, args);
  return rows;
}
