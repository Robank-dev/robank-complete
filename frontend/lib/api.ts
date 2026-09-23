import { getAccessToken } from '@privy-io/react-auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const accessToken = await getAccessToken().catch(() => null);
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...(options?.headers || {})
    }
  });

  const contentType = response.headers.get('content-type') || '';
  if (!response.ok) {
    const body = contentType.includes('application/json') ? await response.json().catch(() => null) : null;
    const message = body?.message || body?.error || (contentType.includes('text/html') ? 'ROBANK data service is not connected.' : '');
    throw new Error(message || `API request failed: ${response.status}`);
  }

  if (!contentType.includes('application/json')) {
    throw new Error('ROBANK data service returned an invalid response.');
  }

  return response.json() as Promise<T>;
}

export const api = {
  health: () => request<{ ok: boolean; service: string }>('/health'),
  registerUser: (walletAddress: string) =>
    request('/api/users/register', {
      method: 'POST',
      body: JSON.stringify({ walletAddress })
    }),
  routePayment: (body: { from: string; to: string; amount: string; token: string }) =>
    request<{
      route: { network: string; asset: string; provider: string; recipient: string; amount: string };
      transaction: { to: string; data: string; value?: string };
    }>('/api/payments/route', {
      method: 'POST',
      body: JSON.stringify(body)
    }),
  paymentIntent: (body: { walletAddress: string; to: string; amount: string; token: 'USDC' | 'USDG'; network: 'base' | 'robinhood' }, idempotencyKey: string) =>
    request<{ intent: { id: string; status: string; walletAddress: string; recipient: string; amount: string; token: string; network: string; idempotencyKey: string }; transaction: { to: string; data: string; value?: string } }>('/api/payments/intent', {
      method: 'POST',
      headers: { 'X-Idempotency-Key': idempotencyKey },
      body: JSON.stringify(body)
    }),
  paymentConfirm: (body: { walletAddress: string; destination: string; amount: string; txHash: string; network: 'base' | 'robinhood'; asset: 'USDC' | 'USDG' }) =>
    request<any>('/api/payments/confirm', { method: 'POST', body: JSON.stringify(body) }),
  agentStatus: () => request<any>('/api/agent/status'),
  agent: (body: { message: string; history?: unknown[]; vaultAddress?: string; walletAddress?: string; context?: unknown }) =>
    request<{ response: string; action?: unknown }>('/api/agent/chat', {
      method: 'POST',
      body: JSON.stringify(body)
    }),
  agentPrepare: (body: { walletAddress: string; destination: string; amount: string; asset: 'USDC' | 'USDG'; network: 'base' | 'robinhood' }) => request<{ stage: string; prepared: any; transaction: { to: string; data: string; value?: string } | null }>('/api/agent/prepare', { method: 'POST', body: JSON.stringify(body) }),
  agentConfirm: (body: { walletAddress: string; destination: string; amount: string; txHash: string; network: 'base' | 'robinhood'; asset: 'USDC' | 'USDG' }) => request<any>('/api/agent/confirm', { method: 'POST', body: JSON.stringify(body) }),
  onramp: (walletAddress: string, amount?: string) => {
    const params = new URLSearchParams({ walletAddress });
    if (amount) params.set('amount', amount);
    return request<{ url: string }>('/api/onramp/url?' + params.toString());
  },
  vault: (address: string) => request(`/api/vault/${address}`),
  assetsDiscover: () =>
    request<{
      generatedAt: string;
      count: number;
      providers: {
        xstocks: {
          ok: boolean;
          error: string | null;
        };
        centrifuge: {
          ok: boolean;
          error: string | null;
        };
        robinhood: {
          ok: boolean;
          error: string | null;
        };
      };
      assets: Array<{
        provider: string;
        type: string;
        network: string;
        symbol: string | null;
        name: string | null;
        status: string | null;
        pricing?: {
          oracle: string | null;
          quoteAsset: string;
          feedId: string | null;
        } | null;
        collateral?: {
          symbol: string;
          priceCurrency: string;
        } | null;
        vaultId?: string | null;
        poolId?: string | null;
        assetAddress?: string | null;
        active?: boolean;
        deployments?: unknown[];
        multiplier?: number | null;
      }>;
    }>('/api/assets/discover'),
  assetInspect: (symbol: string) =>
    request('/api/assets/inspect/' + encodeURIComponent(symbol)),
  cardStatus: () =>
    request<{
      card: {
        status: string;
        provider: string;
        providerName: string;
        liveOperations: boolean;
        providerActivation: string;
        credentials: {
          apiKey: boolean;
          apiSecret: boolean;
        };
        capabilities: string[];
        operations: {
          issue: boolean;
          manage: boolean;
          freeze: boolean;
          unfreeze: boolean;
          fund: boolean;
          transactions: boolean;
        };
      };
    }>('/api/card/status'),
  borrowStatus: (address: string) =>
    request<{
      address: string;
      provider: string;
      network: string;
      positionCount: number;
      totals: {
        collateralUsd: number;
        debtUsd: number;
      };
      positions: Array<{
        marketId: string | null;
        loanAsset: string | null;
        collateralAsset: string | null;
        borrowCapacityUsd: number;
        collateralCapacityUsd: number;
        marketLiquidityUsd: number;
        risk: unknown;
      }>;
    }>('/api/borrow/status/' + encodeURIComponent(address)),
  borrowQuote: () =>    request<{
      provider: string;
      network: string;
      marketCount: number;
      quotes: Array<{
        marketId: string;
        loanAsset: string | null;
        collateralAsset: string | null;
        liquidationLtv: number;
        borrowApy: number;
        supplyApy: number;
        utilization: number;
        liquidityUsd: number;
        borrowAssetsUsd: number;
        supplyAssetsUsd: number;
        capacityStatus: 'available' | 'constrained';
      }>;
    }>('/api/borrow/quote'),
  companies: (walletAddress: string) => request<any>('/api/companies?walletAddress=' + encodeURIComponent(walletAddress)),
  createCompany: (body: { walletAddress:string; legalName:string; registrationNumber?:string; countryCode?:string }) => request<any>('/api/companies',{method:'POST',body:JSON.stringify(body)}),
  verifyCompany: (id:string,walletAddress:string) => request<any>('/api/companies/'+encodeURIComponent(id)+'/verify',{method:'POST',body:JSON.stringify({walletAddress})}),
  jobs: (params='') => request<any>('/api/jobs' + params),
  createJob: (body:any) => request<any>('/api/jobs',{method:'POST',body:JSON.stringify(body)}),
  claimJob: (id:string,walletAddress:string) => request<any>('/api/jobs/'+encodeURIComponent(id)+'/claim',{method:'POST',body:JSON.stringify({walletAddress})}),
  submitJob: (id:string,walletAddress:string,submission:string) => request<any>('/api/jobs/'+encodeURIComponent(id)+'/submit',{method:'POST',body:JSON.stringify({walletAddress,submission})}),
  jobStatus: (id:string,walletAddress:string,status:string) => request<any>('/api/jobs/'+encodeURIComponent(id)+'/status',{method:'POST',body:JSON.stringify({walletAddress,status})}),
  markets: () => request<any>('/api/markets'),
  news: (params='') => request<any>('/api/news'+params),
  assetQuote: (symbol: string) =>
    request<{
      symbol: string;
      provider: string;
      network: string;
      price: number | null;
      quoteAsset: string;
      oracle: string | null;
      feedId: string | null;
      generatedAt: string;
    }>('/api/assets/quote/' + encodeURIComponent(symbol))
};
