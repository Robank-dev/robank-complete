import { env } from './env';
import { HttpError, fetchJson } from './http';

/** Didit workflows are configuration, not secrets. KYC is "KYC + AML"; KYB is set once its workflow exists. */
export const DIDIT_WORKFLOWS = {
  kyc: () => env('DIDIT_KYC_WORKFLOW_ID') || '5f5e0195-b521-4e50-b65b-c9ad88207ba6',
  kyb: () => env('DIDIT_KYB_WORKFLOW_ID')
};

export const diditEnabled = (kind: keyof typeof DIDIT_WORKFLOWS) => Boolean(env('DIDIT_API_KEY') && DIDIT_WORKFLOWS[kind]());

/** Creates a hosted Didit verification session. Requires DIDIT_API_KEY and a workflow for the flow. */
export async function createDiditSession(kind: keyof typeof DIDIT_WORKFLOWS, vendorData: string, callbackPath = '/company') {
  const apiKey = env('DIDIT_API_KEY');
  const workflowId = DIDIT_WORKFLOWS[kind]();
  if (!apiKey || !workflowId) throw new HttpError(503, 'Verification is not available yet. ROBANK has not enabled this provider.');
  let response: Response;
  try {
    response = await fetch('https://verification.didit.me/v3/session/', {
      method: 'POST',
      headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ workflow_id: workflowId, vendor_data: vendorData, callback: `https://robank.co${callbackPath}`, language: 'en' })
    });
  } catch {
    throw new HttpError(502, 'Didit is unreachable right now. Try again in a moment.');
  }
  const data: any = await response.json().catch(() => null);
  if (!response.ok) {
    // Didit returns either {"field": ["message"]} or {"detail": "message"}; show it so setup problems are obvious.
    const detail = data && typeof data === 'object'
      ? Object.entries(data).map(([k, v]) => `${k === 'detail' ? '' : k + ': '}${Array.isArray(v) ? v.join(' ') : String(v)}`).join(' · ').slice(0, 300)
      : '';
    console.error('[robank] didit session error', response.status, detail);
    throw new HttpError(response.status === 401 || response.status === 403 ? 503 : 502, `Didit (${response.status}): ${detail || 'the verification could not be created.'}`);
  }
  const url = String(data?.url || '');
  if (!url.startsWith('https://')) throw new HttpError(502, 'Didit did not return a verification link.');
  return { sessionId: String(data?.session_id || ''), url };
}

export type VerificationStatus = 'not_started' | 'pending' | 'in_review' | 'approved' | 'declined';

/** Didit reports statuses as "Approved"/"In Review" (KYC) or "APPROVED"/"IN_REVIEW" (KYB); compare loosely. */
export function normalizeDiditStatus(value: unknown): VerificationStatus {
  const s = String(value || '').toLowerCase().replace(/[\s_-]+/g, '');
  if (s === 'approved') return 'approved';
  if (s === 'declined' || s === 'rejected') return 'declined';
  if (s === 'inreview' || s === 'resubmitted' || s === 'awaitinguser') return 'in_review';
  if (s === 'notstarted') return 'not_started';
  return 'pending'; // in progress, not finished, expired/abandoned sessions can be restarted
}

/** Reads the current decision for a session. Returns null when Didit is unreachable. */
export async function diditDecision(sessionId: string): Promise<VerificationStatus | null> {
  const apiKey = env('DIDIT_API_KEY');
  if (!apiKey || !sessionId) return null;
  const data = await fetchJson<any>(`https://verification.didit.me/v3/session/${encodeURIComponent(sessionId)}/decision/`, {
    provider: 'Didit', timeoutMs: 8000, headers: { 'x-api-key': apiKey }
  }).catch(() => null);
  return data ? normalizeDiditStatus(data.status) : null;
}

/** Full decision payload (identity data + presigned image URLs). Server-side only; never sent to the browser as-is. */
export async function diditSessionData(sessionId: string): Promise<any> {
  const apiKey = env('DIDIT_API_KEY');
  if (!apiKey || !sessionId) throw new HttpError(503, 'Verification is not available yet.');
  return fetchJson<any>(`https://verification.didit.me/v3/session/${encodeURIComponent(sessionId)}/decision/`, {
    provider: 'Didit', timeoutMs: 12000, headers: { 'x-api-key': apiKey }
  });
}

/** Didit's compliance PDF for an approved session. */
export async function diditPdf(sessionId: string): Promise<ArrayBuffer> {
  const response = await fetch(`https://verification.didit.me/v3/session/${encodeURIComponent(sessionId)}/generate-pdf/`, { headers: { 'x-api-key': env('DIDIT_API_KEY') } });
  if (!response.ok) throw new HttpError(502, 'The verification report could not be generated.');
  return response.arrayBuffer();
}
