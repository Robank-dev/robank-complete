import { Router } from 'express';
import {
  getQuote,
  getSupportedChains,
  getSupportedTokens,
  getSupportedSwapTokens,
  validateSupportedChain,
  validateSupportedToken,
} from '../services/lifi.js';

const router = Router();

router.get('/chains', async (_req, res) => {
  try {
    const chains = await getSupportedChains();
    res.json({ chains });
  } catch (error) {
    res.status(502).json({ error: error.message });
  }
});

router.get('/tokens', async (_req, res) => {
  try {
    const tokens = await getSupportedTokens();
    res.json({ tokens });
  } catch (error) {
    res.status(502).json({ error: error.message });
  }
});

router.get('/swap-tokens', async (_req, res) => {
  try {
    const tokens = await getSupportedSwapTokens();
    res.json({ tokens });
  } catch (error) {
    res.status(502).json({ error: error.message });
  }
});

router.post('/quote', async (req, res) => {
  const {
    fromChain, toChain, fromToken, toToken, fromAddress, toAddress,
    amount, mode = 'fromAmount', purpose = 'transfer'
  } = req.body || {};
  if (!validateSupportedChain(fromChain) || !validateSupportedChain(toChain)) {
    return res.status(400).json({ error: 'Unsupported source or destination network.' });
  }
  if (!['fromAmount', 'toAmount'].includes(mode)) {
    return res.status(400).json({ error: 'Invalid quote mode.' });
  }
  if (!fromToken || !toToken || !fromAddress || !toAddress || !amount) {
    return res.status(400).json({ error: 'Missing quote parameters.' });
  }
  if (Number(amount) <= 0) return res.status(400).json({ error: 'Invalid amount.' });
  try {
    const sourceTokenPromise = validateSupportedToken(fromChain, fromToken);
    const destinationTokenPromise = purpose === 'swap'
      ? getSupportedSwapTokens().then((items) => items.find((token) =>
        Number(token.chainId) === Number(toChain) &&
        token.address.toLowerCase() === String(toToken).toLowerCase()) || null)
      : validateSupportedToken(toChain, toToken);
    const [sourceToken, destinationToken] = await Promise.all([sourceTokenPromise, destinationTokenPromise]);
    if (!sourceToken || !destinationToken) {
      return res.status(400).json({ error: 'Unsupported asset/network combination.' });
    }
    const quote = await getQuote({
      fromChain, toChain, fromToken: sourceToken.address,
      toToken: destinationToken.address, fromAddress, toAddress,
      amount, mode, feeBps: Number(process.env.ROBANK_LIFI_FEE_BPS || 0)
    });
    return res.json({ quote });
  } catch (error) {
    return res.status(502).json({ error: error.message });
  }
});

export default router;
