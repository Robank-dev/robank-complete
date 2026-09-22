const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {})
    }
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `API request failed: ${response.status}`);
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
    request<{ to: string; data: string; value?: string }>('/api/payments/route', {
      method: 'POST',
      body: JSON.stringify(body)
    }),
  agent: (body: { message: string; history?: unknown[]; vaultAddress?: string }) =>
    request<{ response: string; action?: unknown }>('/api/agent/chat', {
      method: 'POST',
      body: JSON.stringify(body)
    }),
  onramp: (walletAddress: string, amount?: string) => {
    const params = new URLSearchParams({ walletAddress });
    if (amount) params.set('amount', amount);
    return request<{ url: string }>('/api/onramp/url?' + params.toString());
  },
  vault: (address: string) => request(`/api/vault/${address}`)
};

