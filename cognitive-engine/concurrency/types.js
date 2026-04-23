/**
 * Concurrency engine — types for the multi-project job queue + scheduler.
 */

/**
 * @typedef {"queued"|"leased"|"done"|"failed"} JobState
 */

/**
 * @typedef {Object} Job
 * @property {string} id                      e.g. "JOB-0042"
 * @property {string} project_id
 * @property {string} kind                    handler kind, e.g. "pre_dev", "dev", "replay"
 * @property {Record<string, any>} payload    job-specific input
 * @property {number} priority                lower = higher priority (default 50)
 * @property {number} max_attempts            default 3
 * @property {number} attempt                 starts at 0
 * @property {string} created_at
 * @property {string} [leased_at]
 * @property {string} [leased_by]             worker id
 * @property {string} [completed_at]
 * @property {Record<string, any>} [result]
 * @property {string} [error]
 * @property {JobState} state
 */

/**
 * @typedef {Object} SchedulerConfig
 * @property {number} parallelism             how many workers run concurrently (default 2)
 * @property {number} poll_interval_ms        how often workers check the queue (default 100)
 * @property {"round_robin"|"priority"|"fifo"} policy   default "round_robin"
 */

/**
 * @typedef {Object} WorkerStatus
 * @property {string} worker_id
 * @property {"idle"|"busy"|"shutdown"} state
 * @property {string} [current_job_id]
 * @property {string} [current_project_id]
 * @property {number} jobs_done
 * @property {number} jobs_failed
 */

/**
 * @typedef {(job: Job, ctx: {workingDir: string, worker_id: string}) => Promise<any>} JobHandler
 */

export const SCHEMA_VERSION = 1;
export const JOB_STATES = Object.freeze(["queued", "leased", "done", "failed"]);
export const SCHEDULING_POLICIES = Object.freeze(["round_robin", "priority", "fifo"]);

export function isValidState(s) { return JOB_STATES.includes(s); }
export function isValidPolicy(p) { return SCHEDULING_POLICIES.includes(p); }

export function nowIso() { return new Date().toISOString(); }
