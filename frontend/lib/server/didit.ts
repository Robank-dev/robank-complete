import { env } from './env';
import { HttpError, fetchJson } from './http';

/** Creates a hosted Didit verification session. Requires DIDIT_API_KEY and the workflow id for the flow. */
export async function createDiditSession(workflowEnv: 'DIDIT_KYC_WORKFLOW_ID' | 'DIDIT_KYB_WORKFLOW_ID', vendorData: string) {
  const apiKey = env('DIDIT_API_KEY');
  const workflowId = env(workflowEnv);
  if (!apiKey || !workflowId) throw new HttpError(503, 'Verification is not available yet. ROBANK has not enabled this provider.');
  const data = await fetchJson<any>('https://verification.didit.me/v3/session/', {
    method: 'POST',
    provider: 'Didit',
    headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ workflow_id: workflowId, vendor_data: vendorData, callback: 'https://robank.co/dashboard' })
  });
  const url = String(data?.url || '');
  if (!url.startsWith('https://')) throw new HttpError(502, 'Didit did not return a verification link.');
  return { sessionId: String(data?.session_id || ''), url };
}
