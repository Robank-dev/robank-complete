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

function localParse(message) {
  const lower = message.toLowerCase();

  if (/\b(balance|saldo)\b/.test(lower)) {
    return {
      response: 'Balance checking requires a connected ROBANK wallet or account.',
      action: {
        type: 'balance',
        message: 'Checking account or wallet balance'
      }
    };
  }

  if (/\b(send|transfer|kirim)\b/.test(lower)) {
    return {
      response: 'A transfer requires a connected wallet, recipient address, asset, and amount. No transfer has been executed.',
      action: {
        type: 'transfer',
        message: 'Transfer request detected'
      }
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

export async function chat({ message, history = [], vaultAddress = null }) {
  if (!config.robankLlmApiKey) {
    return localParse(message);
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
      content: `User request: ${message}${vaultAddress ? `\nConnected vault: ${vaultAddress}` : ''}`
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
