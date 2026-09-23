import { listAgentJobs, runAgentJob } from './agentJobs.js';

const timers = new Map();
const listeners = new Set();

function emit(event) {
  for (const listener of listeners) {
    try {
      listener(event);
    } catch {
      // Listener failures must not stop the scheduler.
    }
  }
}

export function onAgentEvent(listener) {
  if (typeof listener !== 'function') {
    throw new Error('listener must be a function');
  }

  listeners.add(listener);

  return () => listeners.delete(listener);
}

export function listScheduledJobs() {
  return listAgentJobs().map((job) => ({
    ...job,
    scheduled: timers.has(job.id)
  }));
}

export function isScheduled(id) {
  return timers.has(id);
}

export function getAgentSchedulerStatus() {
  const jobs = listScheduledJobs();
  const scheduledJobs = jobs.filter((job) => job.scheduled);

  return {
    status: scheduledJobs.length > 0 ? 'running' : 'stopped',
    registeredJobCount: jobs.length,
    scheduledJobCount: scheduledJobs.length,
    jobs
  };
}

export async function runScheduledJob(id, context = {}) {
  emit({
    type: 'job.started',
    jobId: id,
    timestamp: new Date().toISOString()
  });

  try {
    const result = await runAgentJob(id, context);

    emit({
      type: 'job.completed',
      jobId: id,
      timestamp: new Date().toISOString(),
      result
    });

    return result;
  } catch (error) {
    emit({
      type: 'job.failed',
      jobId: id,
      timestamp: new Date().toISOString(),
      error: error.message
    });

    throw error;
  }
}

export function scheduleAgentJob(id, context = {}) {
  if (timers.has(id)) return false;

  const job = listAgentJobs().find((entry) => entry.id === id);

  if (!job) {
    throw new Error(`Agent job not found: ${id}`);
  }

  if (!job.enabled) return false;

  const timer = setInterval(() => {
    runScheduledJob(id, context).catch(() => {});
  }, job.intervalMs);

  timers.set(id, timer);

  emit({
    type: 'job.scheduled',
    jobId: id,
    intervalMs: job.intervalMs,
    timestamp: new Date().toISOString()
  });

  return true;
}

export function unscheduleAgentJob(id) {
  const timer = timers.get(id);

  if (!timer) return false;

  clearInterval(timer);
  timers.delete(id);

  emit({
    type: 'job.unscheduled',
    jobId: id,
    timestamp: new Date().toISOString()
  });

  return true;
}

export function startAgentScheduler(context = {}) {
  const jobs = listAgentJobs();

  for (const job of jobs) {
    if (job.enabled) {
      scheduleAgentJob(job.id, context);
    }
  }

  emit({
    type: 'scheduler.started',
    timestamp: new Date().toISOString(),
    jobCount: jobs.filter((job) => job.enabled).length
  });

  return listScheduledJobs();
}

export function stopAgentScheduler() {
  for (const id of timers.keys()) {
    clearInterval(timers.get(id));
  }

  timers.clear();

  emit({
    type: 'scheduler.stopped',
    timestamp: new Date().toISOString()
  });
}