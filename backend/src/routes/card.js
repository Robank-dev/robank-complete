import { Router } from 'express';
import { getProvider } from '../integrations/registry.js';
import { listCardBins } from '../integrations/buvei/client.js';

const router = Router();

router.get('/status', async (_req, res) => {
  const provider = getProvider('buvei');

  const apiKeyConfigured = Boolean(process.env.BUVEI_API_KEY);
  const apiSecretConfigured = Boolean(process.env.BUVEI_API_SECRET);
  const credentialsConfigured = apiKeyConfigured && apiSecretConfigured;
  let bin = null;
  let brand = null;
  let currency = null;
  let issuingCountry = null;
  let requireKycCardholder = null;
  if (credentialsConfigured) {
    try {
      const result = await listCardBins();
      const bins = Array.isArray(result?.data?.data) ? result.data.data : [];
      const visa = bins.find((item) => String(item.brand || '').toUpperCase() === 'VISA');
      const selected = visa || bins[0] || null;
      if (selected) {
        bin = selected.bin || null;
        brand = selected.brand || null;
        currency = selected.currency || null;
        issuingCountry = selected.issuingCountry || null;
        requireKycCardholder = Boolean(selected.requireKycCardholder);
      }
    } catch {
      // Credentials can be present while the provider or egress is temporarily unavailable.
    }
  }

  res.json({
    card: {
      status: credentialsConfigured ? 'credentials-configured' : 'provider-dependent',
      provider: provider?.id || 'buvei',
      providerName: provider?.name || 'Buvei',
      bin,
      brand,
      currency,
      issuingCountry,
      requireKycCardholder,
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
