import { ROBANK_SKILL_FILES } from '@/lib/robankSkillData';

const REF_MAP: [string, string[]][] = [
  ['robank-x402.md', ['x402', '402', 'machine payment', 'machine-to-machine']],
  ['robank-payments.md', ['payment', 'pay', 'send', 'transfer', 'usdc', 'usdt']],
  ['robank-treasury.md', ['treasury', 'vault', 'rebalance', 'liquidity']],
  ['robank-rwa.md', ['rwa', 'tokenized', 'stock', 'gold', 'asset']],
  ['robank-security.md', ['security', 'permission', 'mandate', 'approval', 'custody']],
  ['robank-agent-tools.md', ['agent', 'wallet', 'balance', 'tool']],
  ['robank-networks.md', ['network', 'base', 'ethereum', 'arbitrum', 'solana']],
  ['robank-api.md', ['api', 'endpoint', 'integration']],
  ['robank-commands.md', ['cli', 'command']]
];

function getSkillContext(message: string) {
  const lower = message.toLowerCase();
  const names = new Set<string>(['SKILL.md']);

  for (const [file, keywords] of REF_MAP) {
    if (keywords.some((keyword) => lower.includes(keyword))) {
      names.add(file);
    }
  }

  return [...names]
    .map((name) => {
      const content = ROBANK_SKILL_FILES[name as keyof typeof ROBANK_SKILL_FILES];
      return content ? `\n### ${name}\n${content}` : '';
    })
    .join('\n');
}

const SYSTEM_PROMPT = `
You are ROBANK AI, a financial software agent for the ROBANK platform.

Use the provided ROBANK Skill documentation as the source of truth.
Answer in the same language as the user.

Important:
- Never invent capabilities, balances, transactions, addresses, quotes, or confirmations.
- Never claim a financial action was executed unless an actual execution result confirms it.
- Treat capabilities as PLANNED or PROVIDER-DEPENDENT when the documentation says so.
- Respect mandates, permissions, approval requirements, and limits.
- Be concise and practical.

Return ONLY valid JSON:
{
  "response": "natural-language answer in Markdown",
  "action": {
    "type": "none",
    "message": "short description"
  }
}
`;

function parseResponse(text: string) {
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
    action: { type: 'none', message: 'No structured action' }
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const message = String(body?.message || '').trim();

    if (!message) {
      return Response.json({ error: 'message is required' }, { status: 400 });
    }

    const history = Array.isArray(body?.history) ? body.history.slice(-10) : [];
    const apiKey = process.env.ROBANK_LLM_API_KEY;
    const baseUrl = process.env.ROBANK_LLM_BASE_URL || 'https://openrouter.ai/api/v1';
    const model = process.env.ROBANK_LLM_MODEL || 'xiaomi/mimo-v2.6-flash';

    if (!apiKey) {
      return Response.json({
        response: 'ROBANK AI is not configured yet.',
        action: { type: 'none', message: 'Missing LLM API key' }
      });
    }

    const messages = [
      {
        role: 'system',
        content: `${SYSTEM_PROMPT}\n\n===== ROBANK SKILL CONTEXT =====${getSkillContext(message)}`
      },
      ...history.map((item: any) => ({
        role: item?.role === 'assistant' ? 'assistant' : 'user',
        content: String(item?.content ?? item?.message ?? '')
      })),
      { role: 'user', content: message }
    ];

    const upstream = await fetch(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.2,
        max_tokens: 1200
      })
    });

    const payload = await upstream.json();

    if (!upstream.ok) {
      return Response.json(
        { error: payload?.error?.message || `LLM request failed: ${upstream.status}` },
        { status: 502 }
      );
    }

    return Response.json(
      parseResponse(payload?.choices?.[0]?.message?.content || '')
    );
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Agent error' },
      { status: 500 }
    );
  }
}
