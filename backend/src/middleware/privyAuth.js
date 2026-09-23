import { PrivyClient } from '@privy-io/node';
import { config } from '../config.js';

let privyClient;

function getPrivyClient() {
  if (!config.privyAppId || !config.privyAppSecret) {
    throw new Error('Privy server credentials are not configured');
  }
  return (privyClient ||= new PrivyClient({
    appId: config.privyAppId,
    appSecret: config.privyAppSecret
  }));
}

export async function requirePrivyAuth(req, res, next) {
  const authorization = req.headers.authorization || '';
  const token = authorization.startsWith('Bearer ')
    ? authorization.slice(7).trim()
    : '';

  if (!token) return res.status(401).json({ error: 'Privy authentication required' });

  try {
    const claims = await getPrivyClient().utils().auth().verifyAccessToken(token);
    req.privy = { userId: claims.user_id, sessionId: claims.session_id };
    return next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired Privy access token' });
  }
}
