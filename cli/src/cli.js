// ROBANK CLI — a thin client over the same API the web app uses.
// It can read, ask and prepare. It never holds keys and cannot sign: transfers open in the app for review.
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import readline from 'node:readline/promises';

const VERSION = '1.0.0';
const CONFIG_DIR = path.join(os.homedir(), '.robank');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');
const CHAINS = { ethereum: 1, eth: 1, base: 8453, arbitrum: 42161, arb: 42161, optimism: 10, op: 10, polygon: 137, bnb: 56, bsc: 56, robinhood: 4663, solana: 1151111081099710, sol: 1151111081099710 };
const STABLES = { 1: ['USDC', 'USDT', 'USDG'], 8453: ['USDC', 'USDT'], 42161: ['USDC', 'USDT', 'USDG'], 10: ['USDC', 'USDT'], 137: ['USDC', 'USDT'], 56: ['USDC', 'USDT'], 4663: ['USDG'], 1151111081099710: ['USDC', 'USDT', 'USDG'] };
const NATIVE = { 1: 'ETH', 8453: 'ETH', 42161: 'ETH', 10: 'ETH', 137: 'POL', 56: 'BNB', 4663: 'ETH', 1151111081099710: 'SOL' };

const c = process.stdout.isTTY && !process.env.NO_COLOR
  ? { dim: (s) => `\x1b[2m${s}\x1b[0m`, bold: (s) => `\x1b[1m${s}\x1b[0m`, red: (s) => `\x1b[31m${s}\x1b[0m`, green: (s) => `\x1b[32m${s}\x1b[0m`, yellow: (s) => `\x1b[33m${s}\x1b[0m` }
  : { dim: (s) => s, bold: (s) => s, red: (s) => s, green: (s) => s, yellow: (s) => s };

class CliError extends Error {}

async function readConfig() {
  try { return JSON.parse(await fs.readFile(CONFIG_FILE, 'utf8')); } catch { return {}; }
}
async function writeConfig(config) {
  await fs.mkdir(CONFIG_DIR, { recursive: true, mode: 0o700 });
  await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2) + '\n', { mode: 0o600 });
}

function baseUrl(config, flags) {
  const raw = flags['api-url'] || process.env.ROBANK_API_URL || config.apiUrl || 'https://robank.co';
  let url;
  try { url = new URL(raw); } catch { throw new CliError(`Invalid API URL: ${raw}`); }
  const local = ['localhost', '127.0.0.1'].includes(url.hostname);
  if (url.protocol !== 'https:' && !local) throw new CliError('The API URL must use https.');
  return url.origin;
}

async function api(ctx, route, { method = 'GET', body, auth = true } = {}) {
  const headers = { Accept: 'application/json', 'User-Agent': `robank-cli/${VERSION}` };
  if (body) headers['Content-Type'] = 'application/json';
  if (auth) {
    const key = process.env.ROBANK_API_KEY || ctx.config.apiKey;
    if (!key) throw new CliError('Not logged in. Create a key in the app (CLI & API page) and run: robank login');
    headers.Authorization = `Bearer ${key}`;
  }
  let response;
  try {
    response = await fetch(ctx.base + route, { method, headers, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(45_000) });
  } catch (error) {
    throw new CliError(error?.name === 'TimeoutError' ? 'The request timed out.' : `Could not reach ${ctx.base}. Check your connection.`);
  }
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 401) throw new CliError(`${data?.error || 'Unauthorized.'} Run: robank login`);
    throw new CliError(data?.error || `Request failed (${response.status}).`);
  }
  if (!data) throw new CliError('The server returned an unexpected response.');
  return data;
}

const usd = (n) => (n == null ? '—' : '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
const out = (ctx, value, human) => (ctx.flags.json ? console.log(JSON.stringify(value, null, 2)) : human());
function table(rows) {
  const widths = rows[0].map((_, i) => Math.max(...rows.map((r) => String(r[i]).length)));
  for (const [n, r] of rows.entries()) console.log(r.map((cell, i) => (i === r.length - 1 ? String(cell) : String(cell).padEnd(widths[i]))).join('  ').replace(/^/, n === 0 ? '' : ''));
}

const commands = {
  async login(ctx) {
    let key = ctx.flags.key || ctx.args[0];
    if (!key) {
      console.log('Create a personal API key at ' + c.bold(`${ctx.base}/cli`) + ' and paste it below.');
      const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
      key = (await rl.question('API key: ')).trim();
      rl.close();
    }
    if (!/^rbk_[A-Za-z0-9]{40}$/.test(key || '')) throw new CliError('That does not look like a ROBANK API key (rbk_…).');
    const probe = { ...ctx, config: { ...ctx.config, apiKey: key } };
    const portfolio = await api(probe, '/api/portfolio');
    await writeConfig({ ...ctx.config, apiKey: key, apiUrl: ctx.base });
    console.log(c.green('✓ Logged in.') + ` EVM ${portfolio.wallets?.evm || '—'} · Solana ${portfolio.wallets?.solana || '—'}`);
    console.log(c.dim(`Key saved to ${CONFIG_FILE} (readable only by you).`));
  },
  async logout(ctx) {
    const { apiKey, ...rest } = ctx.config;
    await writeConfig(rest);
    console.log(apiKey ? 'Logged out. Revoke the key in the app if it may have leaked.' : 'You were not logged in.');
  },
  async status(ctx) {
    const data = await api(ctx, '/api/status', { auth: false });
    out(ctx, data, () => {
      const label = { live: c.green('LIVE'), 'needs-configuration': c.yellow('NOT ENABLED'), 'not-available': c.dim('NOT AVAILABLE') };
      table([['CAPABILITY', 'STATE'], ...data.capabilities.map((x) => [x.label, label[x.state] || x.state])]);
    });
  },
  async balance(ctx) {
    const data = await api(ctx, '/api/portfolio' + (ctx.flags.fresh ? '?fresh=1' : ''));
    out(ctx, data, () => {
      console.log(c.bold(`Total ${usd(data.totalUsd)}`) + c.dim(`  (${new Date(data.generatedAt).toLocaleTimeString()})`));
      if (!data.holdings.length) console.log(c.dim('No supported assets yet. Run `robank wallet` to see your deposit addresses.'));
      else table([['ASSET', 'NETWORK', 'AMOUNT', 'VALUE'], ...data.holdings.map((h) => [h.symbol, h.network, h.quantity, h.valueUsd == null ? 'no price' : usd(h.valueUsd)])]);
      for (const s of data.sources.filter((s) => !s.ok)) console.log(c.yellow(`! ${s.error}`));
    });
  },
  async wallet(ctx) {
    const data = await api(ctx, '/api/portfolio');
    out(ctx, data.wallets, () => {
      console.log(`EVM     ${data.wallets.evm || 'preparing…'}  ${c.dim('(Ethereum, Base, Arbitrum, Optimism, Polygon, BNB, Robinhood)')}`);
      console.log(`Solana  ${data.wallets.solana || 'preparing…'}`);
    });
  },
  async stocks(ctx) {
    const data = await api(ctx, '/api/stocks', { auth: false });
    const q = (ctx.args.join(' ') || '').toLowerCase();
    const rows = data.stocks.filter((s) => !q || s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)).slice(0, Number(ctx.flags.limit) || 25);
    out(ctx, rows, () => {
      if (!rows.length) return console.log('No matches.');
      table([['SYMBOL', 'ISSUER', 'NETWORKS', 'REF PRICE'], ...rows.map((s) => [s.symbol, s.provider === 'xstocks' ? 'xStocks' : 'Robinhood', s.networks.map((n) => n.label).join(','), usd(s.priceUsd)])]);
      console.log(c.dim('Reference prices track the underlying share and are indicative only.'));
    });
  },
  async borrow(ctx) {
    const data = await api(ctx, '/api/borrow', { auth: false });
    const chain = ctx.flags.chain ? CHAINS[String(ctx.flags.chain).toLowerCase()] : null;
    const markets = data.networks.filter((n) => !chain || n.chainId === chain).flatMap((n) => n.markets).slice(0, Number(ctx.flags.limit) || 20);
    out(ctx, markets, () => table([['COLLATERAL', 'BORROW', 'NETWORK', 'MAX LTV', 'APY', 'AVAILABLE'], ...markets.map((m) => [m.collateral.symbol, m.loan.symbol, m.chainId === 8453 ? 'Base' : 'Robinhood', m.lltvPercent.toFixed(1) + '%', m.borrowApy == null ? '—' : m.borrowApy.toFixed(2) + '%', usd(m.liquidityUsd)])]));
  },
  async ask(ctx) {
    const message = ctx.args.join(' ').trim();
    if (!message) throw new CliError('Usage: robank ask "what is my balance?"');
    const data = await api(ctx, '/api/agent/chat', { method: 'POST', body: { message, history: [] } });
    out(ctx, data, () => {
      console.log(data.response);
      if (data.action?.type === 'prepare-transfer') console.log('\n' + c.yellow('Not sent.') + ` Review and sign: ${ctx.base}${data.action.path}`);
      else if (data.action?.type === 'navigate') console.log(c.dim(`\n→ ${ctx.base}${data.action.path}`));
    });
  },
  async send(ctx) {
    const [amount, assetRaw, to] = ctx.args;
    const chainId = CHAINS[String(ctx.flags.chain || '').toLowerCase()];
    if (!amount || !assetRaw || !to || !chainId) throw new CliError('Usage: robank send <amount> <asset> <address> --chain <base|ethereum|arbitrum|optimism|polygon|bnb|robinhood|solana>');
    const asset = assetRaw.toUpperCase();
    if (!/^\d+(\.\d{1,18})?$/.test(amount) || Number(amount) <= 0) throw new CliError('Amount must be a positive number.');
    if (!(STABLES[chainId] || []).includes(asset) && NATIVE[chainId] !== asset) throw new CliError(`${asset} is not supported on that network.`);
    const valid = chainId === 1151111081099710 ? /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(to) : /^0x[a-fA-F0-9]{40}$/.test(to);
    if (!valid) throw new CliError('Recipient is not a valid address for that network.');
    const url = `${ctx.base}/send?${new URLSearchParams({ asset, chain: String(chainId), to, amount })}`;
    out(ctx, { prepared: true, sent: false, reviewUrl: url }, () => {
      console.log(c.bold('Transfer prepared — nothing has been sent.'));
      console.log(`${amount} ${asset} → ${to}`);
      console.log(`Open to check the fee and sign in your wallet:\n${url}`);
    });
  },
  async jobs(ctx) {
    const data = await api(ctx, '/api/jobs?scope=' + (ctx.flags.mine ? 'mine' : 'open'));
    out(ctx, data.jobs, () => {
      if (!data.jobs.length) return console.log('No jobs.');
      table([['STATUS', 'REWARD', 'TITLE'], ...data.jobs.map((j) => [j.status, j.rewardAmount ? `${j.rewardAmount} ${j.rewardAsset}` : '—', j.title.slice(0, 60)])]);
    });
  },
  help() {
    console.log(`${c.bold('robank')} ${VERSION} — ROBANK from your terminal

  login [key]              Save a personal API key (create one at robank.co/cli)
  logout                   Remove the saved key
  status                   What ROBANK can do right now
  balance [--fresh]        Your on-chain balances
  wallet                   Your deposit addresses
  stocks [query]           Tokenized stocks (xStocks, Robinhood Stock Tokens)
  borrow [--chain base]    Morpho borrow markets
  ask "<message>"          Ask the ROBANK agent
  send <amt> <asset> <to> --chain <net>
                           Prepare a transfer and print the link to review & sign
  jobs [--mine]            Open jobs, or yours

  Global: --json  --api-url <url>   Env: ROBANK_API_KEY, ROBANK_API_URL

The CLI never holds your wallet keys and cannot move funds by itself.`);
  }
};

function parse(argv) {
  const args = [];
  const flags = {};
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const [k, v] = a.slice(2).split('=');
      if (v !== undefined) flags[k] = v;
      else if (argv[i + 1] && !argv[i + 1].startsWith('--') && !['json', 'fresh', 'mine', 'help'].includes(k)) flags[k] = argv[++i];
      else flags[k] = true;
    } else args.push(a);
  }
  return { args, flags };
}

export async function main(argv = process.argv.slice(2)) {
  const { args, flags } = parse(argv);
  const name = flags.version ? 'version' : flags.help ? 'help' : args.shift() || 'help';
  if (name === 'version') return console.log(VERSION);
  const command = commands[name];
  if (!command) {
    console.error(c.red(`Unknown command: ${name}`));
    commands.help();
    process.exitCode = 1;
    return;
  }
  try {
    const config = await readConfig();
    await command({ args, flags, config, base: baseUrl(config, flags) });
  } catch (error) {
    console.error(c.red('Error: ') + (error instanceof CliError ? error.message : 'Unexpected failure. Use --json for raw output or try again.'));
    process.exitCode = 1;
  }
}
