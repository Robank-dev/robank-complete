import { Router } from 'express';
import { getProvider } from '../integrations/registry.js';

const router = Router();

router.get('/status', (_req, res) => {
  const provider = getProvider('buvei');

  const apiKeyConfigured = Boolean(process.env.BUVEI_API_KEY);
  const apiSecretConfigured = Boolean(process.env.BUVEI_API_SECRET);
  const credentialsConfigured = apiKeyConfigured && apiSecretConfigured;

  res.json({
    card: {
      status: credentialsConfigured ? 'credentials-configured' : 'provider-dependent',
      provider: provider?.id || 'buvei',
      providerName: provider?.name || 'Buvei',
      liveOperations: false,
      providerActivation: 'unknown',
      credentials: {
        apiKey: apiKeyConfigured,
        apiSecret: apiSecretConfigured
      },
      capabilities: provider?.capabilities || [],
      operations: {
        issue: false,
        manage: false,
        freeze: false,
        unfreeze: false,
        fund: false,
        transactions: false
      }
    }
  });
});

export default router;
