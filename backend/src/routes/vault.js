import { Router } from 'express';
import { createPublicClient, http, getContract, erc20Abi } from 'viem';
import { baseSepolia } from 'viem/chains';
import { config } from '../config.js';
import { USDC_BASE_SEPOLIA } from '../constants.js';

const router = Router();
const client = createPublicClient({ chain: baseSepolia, transport: http(config.baseRpcUrl) });

router.get('/:address', async (req, res) => {
  const address = req.params.address;
  try {
    const balance = await client.readContract({
      address: USDC_BASE_SEPOLIA,
      abi: erc20Abi,
      functionName: 'balanceOf',
      args: [address]
    });
    res.json({ address, balance: balance.toString(), token: 'USDC', decimals: 6 });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
