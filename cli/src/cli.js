#!/usr/bin/env node
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  createPublicClient,
  formatUnits,
  getAddress,
  http,
  parseAbiItem,
} from "viem";
import { base } from "viem/chains";

const USDC_BASE_MAINNET = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const TRANSFER_EVENT = parseAbiItem(
  "event Transfer(address indexed from, address indexed to, uint256 value)"
);

const DEFAULT_API_URL = process.env.ROBANK_API_URL || "http://localhost:3001";
const CONFIG_DIR = path.join(os.homedir(), ".robank");
const CONFIG_FILE = path.join(CONFIG_DIR, "config.json");

async function readConfig() {
  try {
    return JSON.parse(await fs.readFile(CONFIG_FILE, "utf8"));
  } catch {
    return {};
  }
}

async function writeConfig(config) {
  await fs.mkdir(CONFIG_DIR, { recursive: true });
  await fs.writeFile(
    CONFIG_FILE,
    `${JSON.stringify(config, null, 2)}\n`,
    "utf8"
  );
}

async function apiRequest(baseUrl, route, options = {}) {
  const response = await fetch(
    `${baseUrl.replace(/\/$/, "")}${route}`,
    {
      ...options,
      headers: {
        Accept: "application/json",
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...(options.headers || {}),
      },
    }
  );

  const text = await response.text();
  let data = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!response.ok) {
    const message =
      typeof data === "object" && data?.error
        ? data.error
        : `HTTP ${response.status}`;
    throw new Error(message);
  }

  return data;
}

function valueAfter(args, flag) {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : undefined;
}

function requiredValue(args, flag) {
  const value = valueAfter(args, flag);
  if (!value) throw new Error(`${flag} is required`);
  return value;
}

function planned(feature) {
  console.log(`${feature}: PROVIDER-DEPENDENT / PLANNED`);
  console.log(
    "No live ROBANK backend endpoint is currently exposed for this operation."
  );
}

function printJson(data) {
  console.log(JSON.stringify(data, null, 2));
}

async function printWalletTransactions(walletAddress, args) {
  const address = getAddress(walletAddress);

  const limitRaw = Number(valueAfter(args, "--limit") || 20);
  const limit = Number.isFinite(limitRaw)
    ? Math.max(1, Math.min(100, Math.floor(limitRaw)))
    : 20;

  const rpcUrl =
    process.env.ROBANK_RPC_URL || "https://mainnet.base.org";

  const client = createPublicClient({
    chain: base,
    transport: http(rpcUrl),
  });

  const latest = await client.getBlockNumber();
  const lookback = 200000n;
  const chunk = 10000n;
  const start =
    latest > lookback ? latest - lookback + 1n : 0n;

  const seen = new Map();

  for (
    let fromBlock = start;
    fromBlock <= latest;
    fromBlock += chunk
  ) {
    const toBlock =
      fromBlock + chunk - 1n > latest
        ? latest
        : fromBlock + chunk - 1n;

    const incoming = await client.getLogs({
      address: USDC_BASE_MAINNET,
      event: TRANSFER_EVENT,
      args: { to: address },
      fromBlock,
      toBlock,
    });

    const outgoing = await client.getLogs({
      address: USDC_BASE_MAINNET,
      event: TRANSFER_EVENT,
      args: { from: address },
      fromBlock,
      toBlock,
    });

    for (const log of [...incoming, ...outgoing]) {
      const txHash = log.transactionHash || "";
      const logIndex = String(log.logIndex ?? "");
      const key = `${txHash}:${logIndex}`;

      const from = log.args?.from
        ? getAddress(log.args.from)
        : null;

      const to = log.args?.to
        ? getAddress(log.args.to)
        : null;

      const direction =
        from?.toLowerCase() === address.toLowerCase()
          ? "outgoing"
          : "incoming";

      seen.set(key, {
        id: txHash,
        type: "transfer",
        status: "confirmed",
        direction,
        asset: "USDC",
        amount: formatUnits(log.args?.value ?? 0n, 6),
        network: "base",
        from,
        to,
        blockNumber: log.blockNumber?.toString() || null,
      });
    }
  }

  const transactions = [...seen.values()]
    .sort((a, b) =>
      Number(
        BigInt(b.blockNumber || "0") -
          BigInt(a.blockNumber || "0")
      )
    )
    .slice(0, limit);

  printJson({
    address,
    network: "base",
    asset: "USDC",
    scannedBlocks: {
      from: start.toString(),
      to: latest.toString(),
    },
    transactions,
  });
}

function help() {
  console.log(`
ROBANK CLI v0.1.0

Usage:
  robank <command> [options]

CAPITAL:
  capital status
  capital activity
  capital power

ASSETS:
  assets discover
  assets inspect <symbol>

BORROW:
  borrow status
  borrow quote

PAYMENTS:
  payments route --to <address> --amount <amount> --token USDC

CARD:
  card status
  card fund --amount <amount>

AGENT:
  agent chat <message>
  jobs list
  jobs create --title <title> --description <text> [--budget <amount>]
  jobs claim <job-id>
  jobs submit <job-id> --text <submission>
  company list
  company add --name <legal-name> [--registration <number>]
  company verify <company-id>
  agent status
  autopilot status

WALLET:
  wallet
  wallet set <address>
  wallet balance
  wallet transactions
  users register

SYSTEM:
  status
  config get
  config set <base-url|wallet-address> <value>

OTHER:
  onramp url [--amount <amount>]
  swap quote
  swap execute
  x402 inspect <url>
  x402 pay <url>
  x402 retry <url>
  rwa discover
  rwa eligibility
  rwa quote <product-or-basket>
  rwa execute <product-or-basket>
  networks list
  networks inspect <network>

Notes:
  ROBANK only reports an operation as live when backed by the
  configured backend/provider integration.
`);
}

async function run(args) {
  const [command, subcommand, ...rest] = args;

  const config = await readConfig();
  const baseUrl = config.baseUrl || DEFAULT_API_URL;
  const walletAddress = config.walletAddress;

  if (!command || command === "--help" || command === "-h") {
    help();
    return;
  }

  if (command === "status") {
    const data = await apiRequest(baseUrl, "/health");
    printJson({
      ...data,
      apiUrl: baseUrl,
    });
    return;
  }

  if (command === "config") {
    if (subcommand === "get") {
      printJson({
        baseUrl,
        walletAddress: walletAddress || null,
      });
      return;
    }

    if (subcommand === "set") {
      const key = rest[0];
      const value = rest[1];

      if (
        !["base-url", "wallet-address"].includes(key) ||
        !value
      ) {
        throw new Error(
          "Use: robank config set <base-url|wallet-address> <value>"
        );
      }

      if (key === "base-url") {
        config.baseUrl = value;
      }

      if (key === "wallet-address") {
        config.walletAddress = value;
      }

      await writeConfig(config);
      console.log(`Saved ${key}.`);
      return;
    }

    throw new Error(
      "Use: robank config get | robank config set ..."
    );
  }

  if (command === "wallet") {
    if (subcommand === "set") {
      if (!rest[0]) {
        throw new Error("wallet address is required");
      }

      config.walletAddress = rest[0];
      await writeConfig(config);

      console.log(`Wallet configured.`);
      return;
    }

    if (subcommand === "balance") {
      if (!walletAddress) {
        throw new Error(
          "Set a wallet first: robank wallet set <address>"
        );
      }

      const data = await apiRequest(
        baseUrl,
        `/api/vault/${encodeURIComponent(walletAddress)}`
      );

      printJson(data);
      return;
    }

    if (subcommand === "transactions") {
      if (!walletAddress) {
        throw new Error(
          "Set a wallet first: robank wallet set <address>"
        );
      }

      await printWalletTransactions(walletAddress, rest);
      return;
    }

    printJson(
      walletAddress
        ? { walletAddress }
        : {
            message:
              "No wallet configured. Use: robank wallet set <address>",
          }
    );
    return;
  }

  if (command === "users" && subcommand === "register") {
    if (!walletAddress) {
      throw new Error(
        "Set a wallet first: robank wallet set <address>"
      );
    }

    const data = await apiRequest(
      baseUrl,
      "/api/users/register",
      {
        method: "POST",
        body: JSON.stringify({ walletAddress }),
      }
    );

    printJson(data);
    return;
  }

  if (command === "capital") {
    if (!walletAddress) {
      throw new Error(
        "Set a wallet first: robank wallet set <address>"
      );
    }

    if (
      subcommand === "status" ||
      subcommand === "power"
    ) {
      const data = await apiRequest(
        baseUrl,
        `/api/vault/${encodeURIComponent(walletAddress)}`
      );

      printJson({
        surface: "capital",
        walletAddress,
        data,
      });
      return;
    }

    if (subcommand === "activity") {
      await printWalletTransactions(walletAddress, rest);
      return;
    }

    throw new Error(
      "Use: robank capital status | robank capital activity | robank capital power"
    );
  }

  if (command === "payments") {
    if (subcommand !== "route") {
      throw new Error(
        "Use: robank payments route --to <address> --amount <amount> --token USDC"
      );
    }

    const to = requiredValue(rest, "--to");
    const amount = requiredValue(rest, "--amount");
    const token = valueAfter(rest, "--token") || "USDC";

    const data = await apiRequest(
      baseUrl,
      "/api/payments/route",
      {
        method: "POST",
        body: JSON.stringify({
          from: walletAddress || "",
          to,
          amount,
          token,
        }),
      }
    );

    printJson(data);
    return;
  }

  if (command === "pay") {
    const to = requiredValue(
      [subcommand, ...rest],
      "--to"
    );
    const amount = requiredValue(
      [subcommand, ...rest],
      "--amount"
    );
    const token =
      valueAfter([subcommand, ...rest], "--token") ||
      "USDC";

    const data = await apiRequest(
      baseUrl,
      "/api/payments/route",
      {
        method: "POST",
        body: JSON.stringify({
          from: walletAddress || "",
          to,
          amount,
          token,
        }),
      }
    );

    printJson(data);
    return;
  }

  if (command === 'company') {
    if (!walletAddress) throw new Error('Login/configure a wallet first.');
    if (subcommand === 'list') { printJson(await apiRequest(baseUrl, `/api/companies?walletAddress=${encodeURIComponent(walletAddress)}`)); return; }
    if (subcommand === 'add') { const name=requiredValue(rest,'--name'); const registration=valueAfter(rest,'--registration'); printJson(await apiRequest(baseUrl,'/api/companies',{method:'POST',body:JSON.stringify({walletAddress,legalName:name,registrationNumber:registration||null,countryCode:'ID'})})); return; }
    if (subcommand === 'verify') { const id=rest[0]; if(!id) throw new Error('Usage: robank company verify <company-id>'); const data=await apiRequest(baseUrl,`/api/companies/${encodeURIComponent(id)}/verify`,{method:'POST',body:JSON.stringify({walletAddress})}); printJson(data); if(data?.verification?.url) console.log(`Open verification: ${data.verification.url}`); return; }
    throw new Error('Use: robank company list | add --name <legal-name> | verify <id>');
  }

  if (command === 'jobs') {
    if (subcommand === 'list') {
      const status = valueAfter(rest, '--status');
      const data = await apiRequest(baseUrl, `/api/jobs?${status ? `status=${encodeURIComponent(status)}` : 'status=open'}`);
      printJson(data); return;
    }
    if (!walletAddress) throw new Error('Login/configure a wallet first.');
    if (subcommand === 'create') {
      const title = requiredValue(rest, '--title'); const description = requiredValue(rest, '--description'); const budget = valueAfter(rest, '--budget');
      const data = await apiRequest(baseUrl, '/api/jobs', { method:'POST', body:JSON.stringify({walletAddress,title,description,budgetAmount:budget||null,budgetAsset:budget?'USDC':null,network:budget?'base':null}) }); printJson(data); return;
    }
    if (subcommand === 'claim') { const id=rest[0]; if(!id) throw new Error('Usage: robank jobs claim <job-id>'); printJson(await apiRequest(baseUrl, `/api/jobs/${encodeURIComponent(id)}/claim`, {method:'POST',body:JSON.stringify({walletAddress})})); return; }
    if (subcommand === 'submit') { const id=rest[0]; const text=requiredValue(rest,'--text'); if(!id) throw new Error('Usage: robank jobs submit <job-id> --text <submission>'); printJson(await apiRequest(baseUrl, `/api/jobs/${encodeURIComponent(id)}/submit`, {method:'POST',body:JSON.stringify({walletAddress,submission:text})})); return; }
    throw new Error('Use: robank jobs list | create | claim <id> | submit <id> --text <text>');
  }

  if (command === "agent") {
    if (subcommand === "chat") {
      const message = rest
        .filter(Boolean)
        .join(" ")
        .trim();

      if (!message) {
        throw new Error(
          "Usage: robank agent chat <message>"
        );
      }

      const data = await apiRequest(
        baseUrl,
        "/api/agent/chat",
        {
          method: "POST",
          body: JSON.stringify({
            message,
            vaultAddress: walletAddress || null,
          }),
        }
      );

      console.log(
        data?.response ?? JSON.stringify(data, null, 2)
      );
      return;
    }

    if (subcommand === "status") {
      const query = walletAddress
        ? `?walletAddress=${encodeURIComponent(walletAddress)}`
        : "";

      const data = await apiRequest(
        baseUrl,
        `/api/agent/status${query}`
      );

      printJson(data);
      return;
    }

    throw new Error(
      "Use: robank agent chat <message> | robank agent status"
    );
  }

  if (command === "onramp" && subcommand === "url") {
    if (!walletAddress) {
      throw new Error(
        "Set a wallet first: robank wallet set <address>"
      );
    }

    const amount = valueAfter(rest, "--amount");
    const params = new URLSearchParams({
      walletAddress,
    });

    if (amount) {
      params.set("amount", amount);
    }

    const data = await apiRequest(
      baseUrl,
      `/api/onramp/url?${params.toString()}`
    );

    printJson(data);
    return;
  }

  if (command === "assets") {
    if (subcommand === "discover") {
      const data = await apiRequest(baseUrl, "/api/assets/discover");
      printJson(data);
      return;
    }

    if (subcommand === "inspect") {
      const symbol = rest[0];
      if (!symbol) {
        throw new Error("Usage: robank assets inspect <symbol>");
      }

      const data = await apiRequest(
        baseUrl,
        `/api/assets/inspect/${encodeURIComponent(symbol)}`
      );

      printJson(data);
      return;
    }

    if (subcommand === "quote") {
      const symbol = rest[0];
      if (!symbol) {
        throw new Error("Usage: robank assets quote <symbol>");
      }

      const data = await apiRequest(
        baseUrl,
        `/api/assets/quote/${encodeURIComponent(symbol)}`
      );

      printJson(data);
      return;
    }

    throw new Error(
      "Use: robank assets discover | robank assets inspect <symbol> | robank assets quote <symbol>"
    );
  }

  if (command === "borrow") {
    if (subcommand === "status") {
      if (!walletAddress) {
        throw new Error(
          "Set a wallet first: robank wallet set <address>"
        );
      }

      const data = await apiRequest(
        baseUrl,
        `/api/borrow/status/${encodeURIComponent(walletAddress)}`
      );

      printJson(data);
      return;
    }

    if (subcommand === "quote") {
      const data = await apiRequest(
        baseUrl,
        "/api/borrow/quote"
      );

      printJson(data);
      return;
    }

    throw new Error(
      "Use: robank borrow status | robank borrow quote"
    );
  }

  if (command === "card") {
    if (subcommand === "status") {
      const data = await apiRequest(baseUrl, "/api/card/status");
      printJson(data);
      return;
    }
    throw new Error("Use: robank card status");
  }

  if (command === "autopilot") {
    if (subcommand === "status") {
      const data = await apiRequest(
        baseUrl,
        "/api/autopilot/status"
      );

      printJson(data);
      return;
    }

    throw new Error(
      "Use: robank autopilot status"
    );
  }

  if (
    command === "swap" ||
    command === "treasury" ||
    command === "x402" ||
    command === "rwa" ||
    command === "networks"
  ) {
    planned(
      `${command}${subcommand ? ` ${subcommand}` : ""}`
    );
    return;
  }

  throw new Error(
    `Unknown command: ${command}. Use "robank --help".`
  );
}

export { run };


