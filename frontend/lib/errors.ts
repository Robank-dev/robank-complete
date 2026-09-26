/** Turns wallet, RPC and provider errors into something a person can act on. Never exposes internals. */
export function friendlyError(error: unknown, fallback = 'Something went wrong. Nothing was sent.'): string {
  const raw = error instanceof Error ? `${error.name} ${error.message} ${(error as any).shortMessage || ''} ${(error as any).details || ''}` : String(error ?? '');
  const text = raw.toLowerCase();
  if (/user rejected|user denied|rejected the request|cancel+ed|user closed|denied transaction|4001/.test(text)) return 'You cancelled in your wallet. Nothing was sent.';
  if (/insufficient funds|exceeds balance|insufficient balance/.test(text)) return 'Not enough balance to cover this amount plus the network fee.';
  if (/gas required exceeds|intrinsic gas|out of gas/.test(text)) return 'The network fee could not be covered. Add some gas token on this network and try again.';
  if (/nonce/.test(text)) return 'Your wallet has a pending transaction. Wait for it to finish, then try again.';
  if (/chain|network/.test(text) && /switch|mismatch|unsupported|not configured/.test(text)) return 'Your wallet could not switch to this network. Try again.';
  if (/timeout|timed out|took too long/.test(text)) return 'The network is slow to respond. Check the explorer before trying again so you do not send twice.';
  if (/failed to fetch|network ?error|networkerror|load failed/.test(text)) return 'Network unavailable. Check your connection and try again.';
  if (/execution reverted|reverted/.test(text)) return 'The transaction was rejected by the contract. Nothing was sent.';
  if (error instanceof Error && error.message && error.message.length < 180 && !/0x[0-9a-f]{20,}|stack|at .*\(/i.test(error.message)) return error.message;
  return fallback;
}
