const DEFAULT_POLICY = {
  autoExecute: false,
  perTransactionLimitUsd: 500,
  dailyLimitUsd: 2000,
  monthlyLimitUsd: 10000,
  liquidityFloorUsd: 5000,
  maxLtv: 0.5,
  allowedAssets: ['USDC', 'USDG'],
  allowedNetworks: ['base', 'robinhood'],
  approvedProviders: [],
  approvalThresholdUsd: 500,
  expiresAt: null,
  revoked: false
};

const policies = new Map();

function normalizePolicy(input = {}) {
  return {
    ...DEFAULT_POLICY,
    ...input,
    allowedAssets: [...(input.allowedAssets || DEFAULT_POLICY.allowedAssets)],
    allowedNetworks: [...(input.allowedNetworks || DEFAULT_POLICY.allowedNetworks)],
    approvedProviders: [...(input.approvedProviders || DEFAULT_POLICY.approvedProviders)]
  };
}

export function createAgentPolicy(walletAddress, input = {}) {
  if (!walletAddress) throw new Error('walletAddress is required');

  const address = walletAddress.toLowerCase();
  const policy = normalizePolicy(input);

  policies.set(address, policy);

  return {
    walletAddress: address,
    policy
  };
}

export function getAgentPolicy(walletAddress) {
  if (!walletAddress) throw new Error('walletAddress is required');

  const address = walletAddress.toLowerCase();
  return policies.get(address) || normalizePolicy();
}

export function revokeAgentPolicy(walletAddress) {
  if (!walletAddress) throw new Error('walletAddress is required');

  const address = walletAddress.toLowerCase();
  const current = getAgentPolicy(address);

  const policy = {
    ...current,
    autoExecute: false,
    revoked: true
  };

  policies.set(address, policy);

  return {
    walletAddress: address,
    policy
  };
}

export function isPolicyExpired(policy) {
  if (!policy?.expiresAt) return false;

  const expiry = new Date(policy.expiresAt).getTime();

  if (!Number.isFinite(expiry)) return true;

  return Date.now() >= expiry;
}

export function evaluateAction({
  walletAddress,
  amountUsd = 0,
  asset = 'USDC',
  network = 'base',
  provider = null,
  currentLtv = 0,
  actionType = 'transaction'
}) {
  const policy = getAgentPolicy(walletAddress);
  const amount = Number(amountUsd);

  const reasons = [];

  if (policy.revoked) {
    reasons.push('agent policy is revoked');
  }

  if (isPolicyExpired(policy)) {
    reasons.push('agent policy has expired');
  }

  if (!Number.isFinite(amount) || amount < 0) {
    reasons.push('invalid amount');
  }

  if (amount > policy.perTransactionLimitUsd) {
    reasons.push('per-transaction limit exceeded');
  }

  if (!policy.allowedAssets.includes(String(asset).toUpperCase())) {
    reasons.push('asset is not allowed');
  }

  if (!policy.allowedNetworks.includes(String(network).toLowerCase())) {
    reasons.push('network is not allowed');
  }

  if (
    provider &&
    policy.approvedProviders.length > 0 &&
    !policy.approvedProviders.includes(provider)
  ) {
    reasons.push('provider is not approved');
  }

  if (Number(currentLtv) > policy.maxLtv) {
    reasons.push('current LTV exceeds policy');
  }

  const requiresApproval =
    !policy.autoExecute ||
    amount > policy.approvalThresholdUsd ||
    actionType === 'first-time-rwa' ||
    actionType === 'new-destination' ||
    actionType === 'policy-change';

  return {
    allowed: reasons.length === 0,
    requiresApproval,
    reasons,
    policy
  };
}

export function canExecuteAction(input) {
  const result = evaluateAction(input);

  return {
    allowed: result.allowed && !result.requiresApproval,
    requiresApproval: result.requiresApproval,
    reasons: result.reasons
  };
}