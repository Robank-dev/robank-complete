import { getAccessToken } from '@privy-io/react-auth';
import type { Holding, SourceStatus } from '@/lib/server/portfolio';
import type { HistoryItem } from '@/app/api/history/route';
export type { HistoryItem };
import { isQa, qaFixture } from '@/lib/qa';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function request<T>(path: string, options: RequestInit & { auth?: boolean; timeoutMs?: number } = {}): Promise<T> {
  const { auth = false, timeoutMs = 30_000, ...init } = options;
  if (auth && isQa()) {
    const fixture = qaFixture(path);
    if (fixture) return fixture as T;
  }
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
  wallets: { evm: string | null };
};


export type Capability = { id: string; label: string; state: 'live' | 'needs-configuration' | 'not-available'; detail: string };

export type Update = { id: string; title: string | null; body: string; xUrl: string | null; imageUrl: string | null; publishedAt: string };

export type Job = {
  id: string; title: string; description: string; rewardAmount: string | null; rewardAsset: string | null; rewardChainId: number | null;
  status: string; creatorWallet: string; workerWallet: string | null; submission: string | null; payoutTxHash: string | null;
  dueAt: string | null; createdAt: string; updatedAt: string; role: 'creator' | 'worker' | null;
};

export type Company = {
  id: string; legalName: string; registrationNumber: string | null; countryCode: string; jurisdictionCode: string | null; status: string; verificationStatus: string; verificationUrl: string | null; createdAt: string;
  entityType: string | null; incorporationDate: string | null; taxId: string | null; website: string | null; industry: string | null;
  addressLine: string | null; city: string | null; postalCode: string | null; contactEmail: string | null; verifiedAt: string | null;
};
export type CompanyInput = Partial<Omit<Company, 'id' | 'status' | 'verificationStatus' | 'verificationUrl' | 'createdAt' | 'verifiedAt'>> & { legalName: string; countryCode: string };
export type KycState = { enabled: boolean; status: 'not_started' | 'pending' | 'in_review' | 'approved' | 'declined'; url: string | null; updatedAt: string | null };

export type Cashout = { id: string; usd: number; fee: number; currency: string; arrive: number | null; paypal: string; status: string; at: string };
export type CashoutState = {
  enabled: boolean; kycApproved: boolean; currencies: string[];
  fees: { percent: number; minUsd: number; minUsdAmount: number; maxUsdAmount: number };
  payment: { chainId: number; asset: 'USDG'; address: string | null };
  cashouts: Cashout[];
};

export type MarketService = {
  id: string; url: string; name: string; description: string; tags: string[]; icon: string | null; method: 'GET' | 'POST';
  fields: Array<{ name: string; description: string; example: string; required: boolean }>; body: string | null;
  priceUnits: string; priceUsd: number; payTo: string; maxTimeoutSeconds: number; score: number;
};
export type MarketCall =
  | { status: 'payment-required'; x402Version: number; resource: unknown; requirement: any; priceUsd: number; service: { id: string; name: string } }
  | { status: 'ok' | 'error'; httpStatus: number; paid: boolean; settlement: string | null; result: { type: string; text?: string; dataUrl?: string } };
export type SwapQuote = {
  side: 'buy' | 'sell';
  stock: { symbol: string; name: string; logo: string | null; contract: string; decimals: number };
  tokenIn: { address: string; symbol: string; decimals: number }; tokenOut: { address: string; symbol: string; decimals: number };
  amountIn: string; amountInDisplay: string; amountOut: string; amountOutDisplay: string; minOut: string; minOutDisplay: string;
  amountInUsd: number | null; amountOutUsd: number | null; gasUsd: number | null; slippageBps: number;
  tx: { to: string; data: string; value: string } | null;
};

export type CardPrefill = { name: string; birthDate: string; nationality: string; idType: string; gender: string; idExpiryDate: string; country: string; state: string; city: string; street: string; postalCode: string };
export type CardApplication = { mobilePrefix: string; mobile: string; occupation: string; sourceOfFund: string; livingCountry: string; country: string; state: string; city: string; street: string; postalCode: string; gender: string; idExpiryDate: string };

export type CardState = {
  enabled: boolean;
  stage: 'none' | 'kyc-pending' | 'kyc-rejected' | 'apply' | 'review' | 'review-rejected' | 'ready-to-issue' | 'issued';
  identity?: { status: 'not_started' | 'pending' | 'in_review' | 'approved' | 'declined'; url: string | null };
  options?: { occupations: string[]; sources: string[] };
  prefill?: CardPrefill | null;
  applicationRejected?: boolean;
  kycUrl?: string | null;
  kycAttemptsLeft?: number;
  applicationPaid?: boolean;
  fees: { applicationUsd: number; loadPercent: number; loadFlatUsd: number };
  payment: { chainId: number; asset: string; address: string | null; minIssueUsd: number; minFundUsd: number };
  card: { cardId: string; status: string; cardNumber: string; brand: string; cardholderName: string; availableBalance: number; totalConsumption: number } | null;
  cardUnavailable?: boolean;
  transactions?: Array<{ id: string; description: string; amount: number; currency: string; status: string; at: number | null }>;
};

export type AgentAction =
  | { type: 'none' }
  | { type: 'navigate'; path: string; label: string }
  | { type: 'prepare-transfer'; path: string; label: string; summary: { asset: string; amount: string; chainId: number; to: string } }
  | { type: 'market'; path: string; label: string; query: string; services: MarketService[] }
  | { type: 'swap'; path: string; label: string; side: 'buy' | 'sell'; symbol: string; amount: string; quote: SwapQuote | null };

export const api = {
  status: () => request<{ capabilities: Capability[]; generatedAt: string }>('/api/status'),
  portfolio: (fresh = false) => request<PortfolioResponse>('/api/portfolio' + (fresh ? '?fresh=1' : ''), { auth: true, timeoutMs: 45_000 }),
  stocks: () => request<{ generatedAt: string; count: number; networks: Record<string, number>; stocks: any[] }>('/api/stocks'),
  markets: () => request<any>('/api/markets'),
  market: (q = '', limit = 24) => request<{ generatedAt: string; services: MarketService[] }>(`/api/market?${new URLSearchParams({ q, limit: String(limit) })}`, { timeoutMs: 45_000 }),
  marketCall: (body: { id: string; params?: Record<string, string>; body?: string; payment?: string }) => request<MarketCall>('/api/market/call', { ...post(body), auth: true, timeoutMs: 60_000 }),
  swap: (body: { side: 'buy' | 'sell'; symbol: string; amount: string }) => request<{ quote: SwapQuote }>('/api/swap', { ...post(body), auth: true, timeoutMs: 30_000 }),
  kyc: () => request<KycState>('/api/kyc', { auth: true }),
  startKyc: () => request<KycState & { url: string }>('/api/kyc', { method: 'POST', auth: true }),
  borrowMarkets: () => request<{ generatedAt: string; networks: any[] }>('/api/borrow'),
  agent: (body: { message: string; history: Array<{ role: 'user' | 'assistant'; content: string }> }) =>
    request<{ response: string; action: AgentAction }>('/api/agent/chat', { ...post(body), auth: true, timeoutMs: 45_000 }),
  updates: () => request<{ updates: Update[]; canPublish: boolean }>('/api/updates'),
  updatesAsViewer: () => request<{ updates: Update[]; canPublish: boolean }>('/api/updates', { auth: true }),
  createUpdate: (body: { title?: string; body: string; xUrl?: string; imageUrl?: string }) => request<{ update: Update }>('/api/updates', { ...post(body), auth: true }),
  deleteUpdate: (id: string) => request<{ ok: true }>('/api/updates/' + encodeURIComponent(id), { method: 'DELETE', auth: true }),
  jobs: (scope: 'open' | 'mine' = 'open') => request<{ jobs: Job[]; canPost: boolean }>('/api/jobs?scope=' + scope, { auth: true }),
  createJob: (body: { title: string; description: string; rewardAmount?: string; rewardAsset?: string; rewardChainId?: number; dueAt?: string }) => request<{ job: Job }>('/api/jobs', { ...post(body), auth: true }),
  jobAction: (id: string, body: { action: 'claim' | 'submit' | 'approve' | 'reject' | 'cancel' | 'record-payout'; submission?: string; txHash?: string }) =>
    request<{ job: Job }>('/api/jobs/' + encodeURIComponent(id), { ...post(body), auth: true, timeoutMs: 45_000 }),
  companies: () => request<{ companies: Company[] }>('/api/companies', { auth: true }),
  createCompany: (body: CompanyInput) => request<{ company: Company }>('/api/companies', { ...post(body), auth: true }),
  verifyCompany: (id: string) => request<{ company: Company; url: string }>('/api/companies/' + encodeURIComponent(id) + '/verify', { method: 'POST', auth: true }),
  card: () => request<CardState>('/api/card', { auth: true }),
  history: () => request<{ items: HistoryItem[] }>('/api/history', { auth: true, timeoutMs: 20_000 }),
  cashout: () => request<CashoutState>('/api/cashout', { auth: true }),
  cashoutRate: (currency: string) => request<{ rate: number }>('/api/cashout', { ...post({ action: 'rate', currency }), auth: true }),
  createCashout: (body: { currency: string; usd: number; paypal: string; firstName: string; lastName: string; txHash: string }) =>
    request<{ cashout: Cashout }>('/api/cashout', { ...post({ action: 'create', ...body }), auth: true, timeoutMs: 60_000 }),
  cardAction: (body: { action: 'verify' | 'apply' | 'issue' | 'fund' | 'reveal' | 'freeze' | 'unfreeze'; txHash?: string; profile?: CardApplication }) => request<any>('/api/card', { ...post(body), auth: true, timeoutMs: 60_000 }),
  keys: () => request<{ keys: Array<{ id: string; name: string; prefix: string; createdAt: string; lastUsedAt: string | null }> }>('/api/keys', { auth: true }),
  createKey: (name: string) => request<{ key: string; record: { id: string; name: string; prefix: string; createdAt: string; lastUsedAt: string | null } }>('/api/keys', { ...post({ name }), auth: true }),
  revokeKey: (id: string) => request<{ ok: true }>('/api/keys/' + encodeURIComponent(id), { method: 'DELETE', auth: true })
};
