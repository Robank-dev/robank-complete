const jobs = new Map();

function registerJob({
  id,
  name,
  description,
  intervalMs,
  enabled = true,
  handler
}) {
  if (!id) throw new Error('job id is required');
  if (typeof handler !== 'function') {
    throw new Error(`handler is required for job ${id}`);
  }

  jobs.set(id, {
    id,
    name,
    description,
    intervalMs,
    enabled,
    lastRunAt: null,
    nextRunAt: null,
    lastResult: null,
    handler
  });
}

registerJob({
  id: 'liquidity-monitor',
  name: 'Liquidity Monitor',
  description: 'Monitor liquid capital against the configured liquidity floor.',
  intervalMs: 60_000,
  handler: async (context = {}) => ({
    job: 'liquidity-monitor',
    action: 'inspect',
    walletAddress: context.walletAddress || null,
    status: 'ready'
  })
});

registerJob({
  id: 'credit-monitor',
  name: 'Credit Monitor',
  description: 'Monitor debt, collateral, LTV and credit health.',
  intervalMs: 60_000,
  handler: async (context = {}) => ({
    job: 'credit-monitor',
    action: 'inspect',
    walletAddress: context.walletAddress || null,
    status: 'ready'
  })
});

registerJob({
  id: 'asset-monitor',
  name: 'Asset Monitor',
  description: 'Monitor supported tokenized-asset positions and asset state; public-stock prices remain market-data context unless a separate brokerage execution integration is verified.',
  intervalMs: 300_000,
  handler: async (context = {}) => ({
    job: 'asset-monitor',
    action: 'inspect',
    walletAddress: context.walletAddress || null,
    status: 'ready'
  })
});

registerJob({
  id: 'allocation-monitor',
  name: 'Allocation Monitor',
  description: 'Detect portfolio drift against configured capital targets.',
  intervalMs: 300_000,
  handler: async (context = {}) => ({
    job: 'allocation-monitor',
    action: 'inspect',
    walletAddress: context.walletAddress || null,
    status: 'ready'
  })
});

registerJob({
  id: 'payment-monitor',
  name: 'Payment Monitor',
  description: 'Monitor scheduled and pending payment obligations.',
  intervalMs: 60_000,
  handler: async (context = {}) => ({
    job: 'payment-monitor',
    action: 'inspect',
    walletAddress: context.walletAddress || null,
    status: 'ready'
  })
});

registerJob({
  id: 'reconciliation',
  name: 'Reconciliation',
  description: 'Reconcile ROBANK ledger state against external rails.',
  intervalMs: 30_000,
  handler: async (context = {}) => ({
    job: 'reconciliation',
    action: 'reconcile',
    walletAddress: context.walletAddress || null,
    status: 'ready'
  })
});

export function listAgentJobs() {
  return [...jobs.values()].map((job) => ({
    id: job.id,
    name: job.name,
    description: job.description,
    intervalMs: job.intervalMs,
    enabled: job.enabled,
    lastRunAt: job.lastRunAt,
    nextRunAt: job.nextRunAt,
    lastResult: job.lastResult
  }));
}

export function getAgentJob(id) {
  const job = jobs.get(id);
  if (!job) return null;

  return {
    id: job.id,
    name: job.name,
    description: job.description,
    intervalMs: job.intervalMs,
    enabled: job.enabled,
    lastRunAt: job.lastRunAt,
    nextRunAt: job.nextRunAt,
    lastResult: job.lastResult
  };
}

export async function runAgentJob(id, context = {}) {
  const job = jobs.get(id);

  if (!job) {
    throw new Error(`Agent job not found: ${id}`);
  }

  if (!job.enabled) {
    return {
      job: id,
      status: 'disabled'
    };
  }

  const startedAt = new Date();
  const result = await job.handler(context);
  const finishedAt = new Date();

  job.lastRunAt = finishedAt.toISOString();
  job.nextRunAt = new Date(
    finishedAt.getTime() + job.intervalMs
  ).toISOString();

  job.lastResult = result;

  return {
    job: id,
    startedAt: startedAt.toISOString(),
    finishedAt: finishedAt.toISOString(),
    nextRunAt: job.nextRunAt,
    result
  };
}