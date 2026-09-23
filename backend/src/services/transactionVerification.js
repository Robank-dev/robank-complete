import { createPublicClient, http, isHash, decodeFunctionData, parseUnits } from 'viem';
import { base } from 'viem/chains';
import { config } from '../config.js';
import { BASE_MAINNET_CHAIN_ID, ROBINHOOD_CHAIN_ID, USDC_BASE_MAINNET, USDG_ROBINHOOD_MAINNET } from '../constants.js';
import { defineChain } from 'viem';

const robinhood = defineChain({
  id: ROBINHOOD_CHAIN_ID,
  name: 'Robinhood Chain',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: { default: { http: [config.robinhoodRpcUrl] } }
});

const clients = {
  base: createPublicClient({ chain: base, transport: http(config.baseRpcUrl) }),
  robinhood: createPublicClient({ chain: robinhood, transport: http(config.robinhoodRpcUrl) })
};

const TOKEN_CONFIG = {
  base: { USDC: { address: USDC_BASE_MAINNET, decimals: 6 } },
  robinhood: { USDG: { address: USDG_ROBINHOOD_MAINNET, decimals: 6 } }
};

export async function verifyMainnetTransaction(txHash, expected = {}) {
  if (!isHash(txHash)) throw new Error('Valid transaction hash is required.');
  const network = expected.network || 'base';
  const client = clients[network];
  const token = String(expected.asset || expected.token || (network === 'base' ? 'USDC' : 'USDG')).toUpperCase();
  const tokenConfig = TOKEN_CONFIG[network]?.[token];
  if (!client || !tokenConfig) throw new Error(`Unsupported verification network/token: ${network}/${token}.`);

  const chainId = await client.getChainId();
  const expectedChainId = network === 'base' ? BASE_MAINNET_CHAIN_ID : ROBINHOOD_CHAIN_ID;
  if (chainId !== expectedChainId) throw new Error(`Unexpected RPC chain: ${chainId}`);

  const [receipt, transaction] = await Promise.all([
    client.getTransactionReceipt({ hash: txHash }),
    client.getTransaction({ hash: txHash })
  ]);

  let transferVerified = false;
  if (receipt.status === 'success' && expected.walletAddress && expected.destination && expected.amount != null) {
    const input = decodeFunctionData({
      abi: [{
        type: 'function', name: 'transfer', stateMutability: 'nonpayable',
        inputs: [{ name: 'to', type: 'address' }, { name: 'amount', type: 'uint256' }],
        outputs: [{ type: 'bool' }]
      }],
      data: transaction.input
    });
    const expectedAmount = parseUnits(String(expected.amount), tokenConfig.decimals);
    transferVerified = transaction.from.toLowerCase() === expected.walletAddress.toLowerCase()
      && transaction.to?.toLowerCase() === tokenConfig.address.toLowerCase()
      && input.functionName === 'transfer'
      && String(input.args[0]).toLowerCase() === expected.destination.toLowerCase()
      && input.args[1] === expectedAmount;
  }

  return {
    verified: receipt.status === 'success' && transferVerified,
    status: receipt.status,
    transactionHash: txHash,
    blockNumber: receipt.blockNumber.toString(),
    chainId,
    network,
    asset: token,
    transferVerified
  };
}

export const verifyBaseMainnetTransaction = verifyMainnetTransaction;
