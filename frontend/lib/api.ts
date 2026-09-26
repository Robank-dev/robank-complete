import { getAccessToken } from '@privy-io/react-auth';
import type { Holding, SourceStatus } from '@/lib/server/portfolio';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function request<T>(path: string, options: RequestInit & { auth?: boolean; timeoutMs?: number } = {}): Promise<T> {
  const { auth = false, timeoutMs = 30_000, ...init } = options;
  const headers: Record<string, string> = { Accept: 'application/json', ...(init.body ? { 'Content-Type': 'application/json' } : {}), ...((init.headers as Record<string, string>) || {}) };
  if (auth) {
    const token = await getAccessToken().catch(() => null);
    if (!token) throw new ApiError(401, 'Sign in to continue.');
    headers.Authorization = `Bearer ${token}`;
  }
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  let response: Response;
  try {
    response = await fetch(path, { ...init, headers, signal: init.signal ?? controller.signal, cache: 'no-store' });
  } catch (error) {
    if ((error as Error)?.name === 'AbortError') throw new ApiError(0, 'The request took too long. Check your connection and try again.');
    throw new ApiError(0, 'Network unavailable. Check your connection and try again.');
  } finally {
    window.clearTimeout(timer);
  }
  const isJson = (response.headers.get('content-type') || '').includes('application/json');
  const body = isJson ? await response.json().catch(() => null) : null;
  if (!response.ok) {
    const message = (body && typeof body.error === 'string' && body.error) || (response.status === 429 ? 'Too many requests. Please wait a moment.' : `Request failed (${response.status}).`);
    throw new ApiError(response.status, message);
  }
  if (!isJson || body === null) throw new ApiError(502, 'The server returned an unexpected response.');
  return body as T;
}

const post = (body: unknown): RequestInit => ({ method: 'POST', body: JSON.stringify(body) });

export type PortfolioResponse = {
  generatedAt: string;
  holdings: Holding[];
  sources: SourceStatus[];
  complete: boolean;
  totalUsd: number;
  unpricedCount: number;
  wallets: { evm: string | null; solana: string | null };
};

export type XStock = { id: string; symbol: string; name: string; logo: string; underlyingSymbol: string; isin: string | null; tradingHalted: boolean; deployments: Array<{ chainId: number; network: string; address: string; decimals: number }> };

export type Capability = { id: string; label: string; state: 'live' | 'needs-configuration' | 'not-available'; detail: string };

export type Update = { id: string; title: string | null; body: string; xUrl: string | null; imageUrl: string | null; publishedAt: string };

export type Job = {
  id: string; title: string; description: string; rewardAmount: string | null; rewardAsset: string | null; rewardChainId: number | null;
  status: string; creatorWallet: string; workerWallet: string | null; submission: string | null; payoutTxHash: string | null;
  dueAt: string | null; createdAt: string; updatedAt: string; role: 'creator' | 'worker' | null;
};

export type Company = { id: string; legalName: string; registrationNumber: string | null; countryCode: string; jurisdictionCode: string | null; status: string; verificationStatus: string; verificationUrl: string | null; createdAt: string };

export type AgentAction =
  | { type: 'none' }
  | { type: 'navigate'; path: string; label: string }
  | { type: 'prepare-transfer'; path: string; label: string; summary: { asset: string; amount: string; chainId: number; to: string } };

export const api = {
  status: () => request<{ capabilities: Capability[]; generatedAt: string }>('/api/status'),
  portfolio: (fresh = false) => request<PortfolioResponse>('/api/portfolio' + (fresh ? '?fresh=1' : ''), { auth: true, timeoutMs: 45_000 }),
  xstocks: () => request<{ generatedAt: string; count: number; assets: XStock[] }>('/api/xstocks', { timeoutMs: 45_000 }),
  stocks: () => request<{ generatedAt: string; count: number; networks: Record<string, number>; stocks: any[] }>('/api/stocks'),
  markets: () => request<any>('/api/markets'),
  agentMarket: (query = '') => request<any>('/api/agent-market' + (query ? `?${query}` : '')),
  borrowMarkets: () => request<{ generatedAt: string; networks: any[] }>('/api/borrow'),
  lifiTokens: () => request<{ tokens: Array<{ chainId: number; address: string; symbol: string; decimals: number }> }>('/api/lifi/tokens'),
  lifiQuote: (body: { fromChain: number; toChain: number; fromToken: string; toToken: string; toAddress: string; amount: string; mode: 'fromAmount' | 'toAmount' }) =>
    request<{ quote: any }>('/api/lifi/quote', { ...post(body), auth: true }),
  agent: (body: { message: string; history: Array<{ role: 'user' | 'assistant'; content: string }> }) =>
    request<{ response: string; action: AgentAction }>('/api/agent/chat', { ...post(body), auth: true, timeoutMs: 45_000 }),
  updates: () => request<{ updates: Update[]; canPublish: boolean }>('/api/updates'),
  updatesAsViewer: () => request<{ updates: Update[]; canPublish: boolean }>('/api/updates', { auth: true }),
  createUpdate: (body: { title?: string; body: string; xUrl?: string; imageUrl?: string }) => request<{ update: Update }>('/api/updates', { ...post(body), auth: true }),
  deleteUpdate: (id: string) => request<{ ok: true }>('/api/updates/' + encodeURIComponent(id), { method: 'DELETE', auth: true }),
  jobs: (scope: 'open' | 'mine' = 'open') => request<{ jobs: Job[] }>('/api/jobs?scope=' + scope, { auth: true }),
  createJob: (body: { title: string; description: string; rewardAmount?: string; rewardAsset?: string; rewardChainId?: number; dueAt?: string }) => request<{ job: Job }>('/api/jobs', { ...post(body), auth: true }),
  jobAction: (id: string, body: { action: 'claim' | 'submit' | 'approve' | 'reject' | 'cancel' | 'record-payout'; submission?: string; txHash?: string }) =>
    request<{ job: Job }>('/api/jobs/' + encodeURIComponent(id), { ...post(body), auth: true, timeoutMs: 45_000 }),
  companies: () => request<{ companies: Company[] }>('/api/companies', { auth: true }),
  createCompany: (body: { legalName: string; registrationNumber?: string; countryCode: string; jurisdictionCode?: string }) => request<{ company: Company }>('/api/companies', { ...post(body), auth: true }),
  verifyCompany: (id: string) => request<{ company: Company; url: string }>('/api/companies/' + encodeURIComponent(id) + '/verify', { method: 'POST', auth: true }),
  card: () => request<{ card: { state: Capability['state']; provider: string; detail: string } }>('/api/card', { auth: true }),
  kycSession: () => request<{ url: string }>('/api/kyc', { method: 'POST', auth: true }),
  keys: () => request<{ keys: Array<{ id: string; name: string; prefix: string; createdAt: string; lastUsedAt: string | null }> }>('/api/keys', { auth: true }),
  createKey: (name: string) => request<{ key: string; record: { id: string; name: string; prefix: string; createdAt: string; lastUsedAt: string | null } }>('/api/keys', { ...post({ name }), auth: true }),
  revokeKey: (id: string) => request<{ ok: true }>('/api/keys/' + encodeURIComponent(id), { method: 'DELETE', auth: true }),
  onrampUrl: (body: { chainId: number; asset: string; amount?: string }) => request<{ url: string }>('/api/onramp', { ...post(body), auth: true })
};
