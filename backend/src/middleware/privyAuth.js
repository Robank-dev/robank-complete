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

export async function requirePrivyWallet(req, res, walletAddress) {
  const normalized = String(walletAddress || '').trim().toLowerCase();
  if (!/^0x[a-f0-9]{40}$/.test(normalized)) {
    res.status(400).json({ error: 'Valid wallet address is required.' });
    return null;
  }

  try {
    const user = await getPrivyClient().users()._get(req.privy.userId);
    const ownsWallet = (user.linked_accounts || []).some((account) => {
      const type = String(account?.type || '').toLowerCase();
      const address = String(account?.address || '').toLowerCase();
      return ['wallet', 'smart_wallet'].includes(type) && address === normalized;
    });

    if (!ownsWallet) {
      res.status(403).json({ error: 'Wallet is not linked to the authenticated Privy account.' });
      return null;
    }

    return normalized;
  } catch {
    res.status(401).json({ error: 'Unable to verify wallet ownership.' });
    return null;
  }
}
