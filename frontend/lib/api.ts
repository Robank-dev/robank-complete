import { getAccessToken } from '@privy-io/react-auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const isLocalRoute = path === '/api/agent/chat' || path === '/api/assets/discover' || path.startsWith('/api/updates') || path.startsWith('/api/kyc') || path.startsWith('/api/agent-market');
  if (!API_URL && !isLocalRoute) {
    throw new Error('ROBANK data service is not connected.');
  }

  const accessToken = await getAccessToken().catch(() => null);
  const isFrontendProxy = path.startsWith('/api/agent-market');
  const response = await fetch(`${isFrontendProxy ? '' : API_URL}${path}`, {
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
  agent: (body: { message: string; history?: unknown[]; walletAddress?: string; context?: unknown }) =>
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
        providerRef?: string | null;
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
        bin?: string;
        balance?: string | number;
        availableBalance?: string | number;
        brand?: string;
        currency?: string;
        issuingCountry?: string;
        requireKycCardholder?: boolean;
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
  companies: (walletAddress: string) => request<any>('/api/companies?walletAddress=' + encodeURIComponent(walletAddress)),
  createCompany: (body: { walletAddress:string; legalName:string; registrationNumber?:string; countryCode?:string }) => request<any>('/api/companies',{method:'POST',body:JSON.stringify(body)}),
  verifyCompany: (id:string,walletAddress:string) => request<any>('/api/companies/'+encodeURIComponent(id)+'/verify',{method:'POST',body:JSON.stringify({walletAddress})}),
  jobs: (params='') => request<any>('/api/jobs' + params),
  createJob: (body:any) => request<any>('/api/jobs',{method:'POST',body:JSON.stringify(body)}),
  claimJob: (id:string,walletAddress:string) => request<any>('/api/jobs/'+encodeURIComponent(id)+'/claim',{method:'POST',body:JSON.stringify({walletAddress})}),
  submitJob: (id:string,walletAddress:string,submission:string) => request<any>('/api/jobs/'+encodeURIComponent(id)+'/submit',{method:'POST',body:JSON.stringify({walletAddress,submission})}),
  jobStatus: (id:string,walletAddress:string,status:string) => request<any>('/api/jobs/'+encodeURIComponent(id)+'/status',{method:'POST',body:JSON.stringify({walletAddress,status})}),
  agentMarket: (query = '') => request<any>('/api/agent-market' + (query ? `?${query}` : '')),
  updates: () => request<{ updates: any[]; provider: string }>('/api/updates'),
  createUpdate: (body: { walletAddress: string; body: string; title?: string; xUrl?: string; imageUrl?: string }) => request<any>('/api/updates', { method:'POST', body: JSON.stringify(body) }),
  deleteUpdate: (id: string, walletAddress: string) => request<any>('/api/updates/' + encodeURIComponent(id), { method:'DELETE', body: JSON.stringify({ walletAddress }) }),
  kycSession: (walletAddress: string) => request<{ provider:string; sessionId:string; url:string }>('/api/kyc/session', { method:'POST', body: JSON.stringify({ walletAddress }) }),
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
