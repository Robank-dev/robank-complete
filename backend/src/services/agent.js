import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { config } from '../config.js';

const SKILL_DIR = path.resolve(process.cwd(), 'src', 'robank-skill');

const BASE_SYSTEM_PROMPT = `
You are ROBANK AI, the financial agent for the ROBANK platform.

Use the ROBANK Skill documentation provided in the context as your source of truth.
Do not invent unsupported capabilities. Clearly distinguish live, beta, planned,
and provider-dependent functionality.

Return ONLY valid JSON with this exact shape:
{
  "response": "natural-language answer in Markdown",
  "action": {
    "type": "none",
    "message": "short description"
  }
}

Available action types may include:
none, balance, transfer, payment, wallet, card, treasury, x402, rwa, info

Rules:
- Never claim a transaction was executed unless an execution tool actually did it.
- Never invent balances, wallet addresses, transaction hashes, prices, or confirmations.
- For unsupported actions, explain the limitation clearly.
- Treat WALLET and BANK as separate funding sources. Never assume they are interchangeable.
- For a transaction where the funding source is not explicit and both sources could apply, ask the user to choose Wallet or Bank before preparing anything.
- Never claim a BANK balance, bank account, card, transfer, or bank execution is live unless the request context explicitly reports an active provider and balance.
- If the requested source lacks sufficient available balance, explain the shortfall and offer another available source only when the context actually reports one.
- If neither available source can cover the request, do not prepare or execute it; tell the user what is missing.
- Only answer or act on ROBANK capabilities exposed by the product context or skill. For unrelated questions, say that the ROBANK agent is limited to wallet, bank/provider, payments, cards, treasury, credit, assets, and supported ROBANK operations.
- Never turn an informational question into a financial action without explicit user intent.
- Prefer concise, practical answers.
`;

const REFERENCE_MAP = [
  ['robank-payments.md', ['payment', 'pay', 'send', 'transfer', 'usdc', 'usdt', 'card']],
  ['robank-treasury.md', ['treasury', 'vault', 'yield', 'cash']],
  ['robank-agent-tools.md', ['agent', 'wallet', 'tool', 'balance']],
  ['robank-x402.md', ['x402', 'http payment', 'api payment']],
  ['robank-rwa.md', ['rwa', 'tokenized', 'stock', 'gold', 'asset']],
  ['robank-security.md', ['security', 'permission', 'custody', 'approval']],
  ['robank-api.md', ['api', 'endpoint', 'integration']],
  ['robank-commands.md', ['command', 'cli']],
  ['robank-networks.md', ['network', 'base', 'ethereum', 'solana', 'arbitrum']]
];

async function readText(file) {
  try {
    return await readFile(path.join(SKILL_DIR, file), 'utf8');
  } catch {
    return '';
  }
}

async function loadSkillContext(message) {
  const skill = await readText('SKILL.md');
  const lower = message.toLowerCase();

  const selected = [];
  for (const [file, keywords] of REFERENCE_MAP) {
    if (keywords.some((keyword) => lower.includes(keyword))) {
      selected.push(file);
    }
  }

  if (!selected.length) {
    selected.push(
      'robank-agent-tools.md',
      'robank-api.md',
      'robank-security.md'
    );
  }

  const references = await Promise.all(
    selected.map(async (file) => {
      const content = await readText(file);
      return content ? `\n\n### ${file}\n${content}` : '';
    })
  );

  return `\n\n===== ROBANK SKILL =====\n${skill}${references.join('')}`;
}

function extractJson(text) {
  const cleaned = String(text || '')
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/i, '')
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {}

  const match = cleaned.match(/\{[\s\S]*\}/);
  if (match) {
    try {
      return JSON.parse(match[0]);
    } catch {}
  }

  return {
    response: cleaned || 'I could not generate a response.',
    action: {
      type: 'none',
      message: 'No structured action'
    }
  };
}

function localParse(message, context = {}) {
  const lower = message.toLowerCase();
  const bank = context?.bank || { connected: false, balance: null, currency: 'USD' };
  const wallet = context?.wallet || { connected: false, balances: [] };

  if (/\b(balance|saldo)\b/.test(lower)) {
    const walletLines = Array.isArray(wallet.balances) && wallet.balances.length
      ? wallet.balances.map((item) => `${item.symbol}: ${item.balance}`).join(' · ')
      : wallet.connected ? 'Wallet connected; balances are still loading.' : 'Wallet not connected.';
    const bankLine = bank.connected && bank.balance != null
      ? `Bank: ${bank.balance} ${bank.currency || 'USD'}`
      : 'Bank: not connected';
    return {
      response: `${walletLines}\n\n${bankLine}`,
      action: { type: 'balance', message: 'Showing available wallet and bank balances' }
    };
  }

  if (/\b(send|transfer|kirim|pay|bayar)\b/.test(lower)) {
    const explicitBank = /\b(bank|fiat|cash|rekening)\b/.test(lower);
    const explicitWallet = /\b(wallet|crypto|onchain)\b/.test(lower);
    if (!explicitBank && !explicitWallet) {
      return {
        response: 'Which source should I use? **Wallet** (on-chain assets) or **Bank** (fiat/provider balance)? I will not prepare a transaction until you choose.',
        action: { type: 'transfer', message: 'Funding source selection required' }
      };
    }
    if (explicitBank && !bank.connected) {
      return {
        response: 'Your Bank source is not connected to a live provider yet, so I cannot move or spend bank funds. You can choose Wallet instead.',
        action: { type: 'transfer', message: 'Bank source unavailable' }
      };
    }
    if (explicitWallet && !wallet.connected) {
      return {
        response: 'Your Wallet is not connected yet. Sign in with your ROBANK email first.',
        action: { type: 'wallet', message: 'Wallet connection required' }
      };
    }
    return {
      response: explicitBank ? 'Bank funding selected. I need a live bank/provider operation and its required recipient details before I can execute anything.' : 'Wallet funding selected. I need the asset, amount, recipient, and network before preparing the transaction.',
      action: { type: 'transfer', message: explicitBank ? 'Bank funding selected' : 'Wallet funding selected' }
    };
  }

  if (lower.includes('x402')) {
    return {
      response: 'x402 is a payment flow for HTTP/API requests where payment can be required before access. The exact implementation depends on the ROBANK integration.',
      action: {
        type: 'x402',
        message: 'Explaining ROBANK x402'
      }
    };
  }

  if (/\b(card|kartu)\b/.test(lower)) {
    return {
      response: 'Card functionality depends on the connected ROBANK/card provider integration.',
      action: {
        type: 'card',
        message: 'Card functionality requested'
      }
    };
  }

  return {
    response: 'ROBANK AI is ready. Ask about balances, payments, transfers, wallets, cards, treasury, x402, or tokenized assets.',
    action: {
      type: 'none',
      message: 'General ROBANK request'
    }
  };
}

export async function chat({ message, history = [], vaultAddress = null, walletAddress = null, context = null }) {
  if (!config.robankLlmApiKey) {
    return localParse(message, context || {});
  }

  const skillContext = await loadSkillContext(message);

  const messages = [
    {
      role: 'system',
      content: `${BASE_SYSTEM_PROMPT}${skillContext}`
    },
    ...history.slice(-20).map((item) => ({
      role: item?.role === 'assistant' ? 'assistant' : 'user',
      content: String(item?.content ?? item?.message ?? '')
    })),
    {
      role: 'user',
      content: `User request: ${message}${walletAddress ? `\nConnected wallet: ${walletAddress}` : ''}${vaultAddress ? `\nConnected vault: ${vaultAddress}` : ''}${context ? `\nLive product context (do not invent beyond this): ${JSON.stringify(context)}` : ''}`
    }
  ];

  const response = await fetch(
    `${config.robankLlmBaseUrl.replace(/\/$/, '')}/chat/completions`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.robankLlmApiKey}`
      },
      body: JSON.stringify({
        model: config.robankLlmModel,
        messages,
        temperature: 0.2,
        max_tokens: 1400
      })
    }
  );

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(
      payload?.error?.message ||
      payload?.message ||
      `LLM request failed with HTTP ${response.status}`
    );
  }

  const text = payload?.choices?.[0]?.message?.content || '';
  return extractJson(text);
}
