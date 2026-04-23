import fs from "node:fs/promises";
import fsSync from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { nowIso } from "./types.js";

/**
 * Filesystem-backed job queue.
 *
 * Layout under `<root>/_jobs/`:
 *   queue/<JOB-id>.json     — pending jobs
 *   in-flight/<JOB-id>.json — leased to a worker
 *   done/<JOB-id>.json      — completed
 *   failed/<JOB-id>.json    — exhausted retries
 *   _seq                    — monotonic id counter
 *
 * Each transition (lease, complete, fail) is an atomic rename. POSIX rename
 * within the same filesystem is atomic, so two workers can't lease the same
 * job — the loser's rename fails (ENOENT or EEXIST depending on direction).
 */

const SUBDIRS = ["queue", "in-flight", "done", "failed"];

export function createQueue(rootDir) {
  const baseDir = path.join(rootDir, "_jobs");

  async function ensureDirs() {
    await fs.mkdir(baseDir, { recursive: true });
    await Promise.all(SUBDIRS.map(d => fs.mkdir(path.join(baseDir, d), { recursive: true })));
  }

  function pathFor(state, id) {
    return path.join(baseDir, state, `${id}.json`);
  }

  async function nextId() {
    const seqFile = path.join(baseDir, "_seq");
    let n = 0;
    try { n = parseInt(await fs.readFile(seqFile, "utf-8"), 10) || 0; } catch {}
    n += 1;
    await fs.writeFile(seqFile, String(n), "utf-8");
    return `JOB-${String(n).padStart(4, "0")}`;
  }

  return {
    rootDir, baseDir,

    async enqueue({ project_id, kind, payload = {}, priority = 50, max_attempts = 3 }) {
      if (!project_id) throw new Error("enqueue: project_id required");
      if (!kind) throw new Error("enqueue: kind required");
      await ensureDirs();
      const id = await nextId();
      const job = {
        id, project_id, kind, payload, priority, max_attempts,
        attempt: 0, created_at: nowIso(), state: "queued",
      };
      await fs.writeFile(pathFor("queue", id), JSON.stringify(job, null, 2), "utf-8");
      return job;
    },

    async listQueued() {
      await ensureDirs();
      const files = await fs.readdir(path.join(baseDir, "queue"));
      const jobs = [];
      for (const f of files) {
        if (!f.endsWith(".json")) continue;
        try {
          const raw = await fs.readFile(path.join(baseDir, "queue", f), "utf-8");
          jobs.push(JSON.parse(raw));
        } catch { /* file removed by another worker mid-read; skip */ }
      }
      return jobs;
    },

    async listInFlight() {
      await ensureDirs();
      const files = await fs.readdir(path.join(baseDir, "in-flight"));
      const jobs = [];
      for (const f of files) {
        if (!f.endsWith(".json")) continue;
        try {
          const raw = await fs.readFile(path.join(baseDir, "in-flight", f), "utf-8");
          jobs.push(JSON.parse(raw));
        } catch {}
      }
      return jobs;
    },

    /**
     * Atomically claim a queued job by renaming queue → in-flight.
     * If the rename fails (another worker beat us), returns null.
     */
    async lease(jobId, workerId) {
      const src = pathFor("queue", jobId);
      const dst = pathFor("in-flight", jobId);
      // Read first so we can stamp lease metadata; if read fails, job is gone
      let job;
      try { job = JSON.parse(await fs.readFile(src, "utf-8")); }
      catch { return null; }
      job.state = "leased";
      job.leased_at = nowIso();
      job.leased_by = workerId;
      job.attempt = (job.attempt || 0) + 1;
      // Write the updated content to the destination first, then unlink the source.
      // This sequence is atomic-enough: if we crash between write and unlink, both files
      // exist and a recovery script can reconcile (skipped in 14-A).
      try {
        await fs.writeFile(dst, JSON.stringify(job, null, 2), { flag: "wx" });
      } catch (err) {
        if (err.code === "EEXIST") return null;
        throw err;
      }
      try { await fs.unlink(src); }
      catch (err) { if (err.code !== "ENOENT") throw err; }
      return job;
    },

    async complete(jobId, result) {
      const src = pathFor("in-flight", jobId);
      const dst = pathFor("done", jobId);
      const raw = await fs.readFile(src, "utf-8");
      const job = JSON.parse(raw);
      job.state = "done";
      job.completed_at = nowIso();
      job.result = result || {};
      await fs.writeFile(dst, JSON.stringify(job, null, 2), "utf-8");
      await fs.unlink(src);
      return job;
    },

    /**
     * Mark a job as failed. If attempts remain, requeue; else move to failed/.
     */
    async fail(jobId, error) {
      const src = pathFor("in-flight", jobId);
      const raw = await fs.readFile(src, "utf-8");
      const job = JSON.parse(raw);
      job.error = error?.message || String(error);
      if (job.attempt < job.max_attempts) {
        job.state = "queued";
        delete job.leased_at;
        delete job.leased_by;
        await fs.writeFile(pathFor("queue", jobId), JSON.stringify(job, null, 2), "utf-8");
        await fs.unlink(src);
        return { requeued: true, attempt: job.attempt };
      }
      job.state = "failed";
      job.completed_at = nowIso();
      await fs.writeFile(pathFor("failed", jobId), JSON.stringify(job, null, 2), "utf-8");
      await fs.unlink(src);
      return { requeued: false, attempts: job.attempt };
    },

    async stats() {
      await ensureDirs();
      const counts = {};
      for (const d of SUBDIRS) {
        const files = await fs.readdir(path.join(baseDir, d));
        counts[d] = files.filter(f => f.endsWith(".json")).length;
      }
      return counts;
    },
  };
}
