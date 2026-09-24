import pg from 'pg';
import { randomUUID } from 'node:crypto';
import { config } from '../config.js';

const { Pool } = pg;
const memoryUsers = new Map();
const memoryLedger = new Map();
const memoryCompanies = new Map();
const memoryJobs = new Map();
const memoryUpdates = new Map();

const pool = config.databaseUrl
  ? new Pool({ connectionString: config.databaseUrl, ssl: { rejectUnauthorized: false } })
  : null;

export async function initDatabase() {
  if (!pool) return;

  await pool.query(`CREATE TABLE IF NOT EXISTS users (
    wallet_address TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`);

  await pool.query(`CREATE TABLE IF NOT EXISTS companies (
    id TEXT PRIMARY KEY,
    owner_wallet TEXT NOT NULL,
    legal_name TEXT NOT NULL,
    registration_number TEXT,
    country_code TEXT NOT NULL DEFAULT 'ID',
    status TEXT NOT NULL DEFAULT 'draft',
    verification_status TEXT NOT NULL DEFAULT 'not_started',
    didit_session_id TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`);

  await pool.query(`CREATE INDEX IF NOT EXISTS idx_companies_owner ON companies (owner_wallet)`);

  await pool.query(`CREATE TABLE IF NOT EXISTS robank_updates (
    id TEXT PRIMARY KEY,
    author_wallet TEXT NOT NULL,
    title TEXT,
    body TEXT NOT NULL,
    x_url TEXT,
    image_url TEXT,
    published_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`);

  await pool.query(`CREATE INDEX IF NOT EXISTS idx_robank_updates_published ON robank_updates (published_at DESC)`);

  await pool.query(`CREATE TABLE IF NOT EXISTS jobs (
    id TEXT PRIMARY KEY,
    creator_wallet TEXT NOT NULL,
    company_id TEXT,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    budget_amount NUMERIC(38,18),
    budget_asset TEXT,
    network TEXT,
    status TEXT NOT NULL DEFAULT 'open',
    funding_status TEXT NOT NULL DEFAULT 'unfunded',
    worker_wallet TEXT,
    submission TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    due_at TIMESTAMPTZ
  )`);

  await pool.query(`ALTER TABLE jobs ADD COLUMN IF NOT EXISTS funding_status TEXT NOT NULL DEFAULT 'unfunded'`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_jobs_status_created ON jobs (status, created_at DESC)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_jobs_creator ON jobs (creator_wallet)`);

  await pool.query(`CREATE TABLE IF NOT EXISTS ledger_transactions (
    id TEXT PRIMARY KEY,
    wallet_address TEXT,
    kind TEXT NOT NULL,
    asset TEXT NOT NULL,
    amount_delta NUMERIC(38,18) NOT NULL,
    status TEXT NOT NULL,
    network TEXT,
    provider TEXT,
    external_id TEXT,
    idempotency_key TEXT UNIQUE,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    confirmed_at TIMESTAMPTZ
  )`);

  await pool.query(`CREATE INDEX IF NOT EXISTS idx_ledger_wallet_created
    ON ledger_transactions (wallet_address, created_at DESC)`);

  await pool.query(`CREATE INDEX IF NOT EXISTS idx_ledger_status
    ON ledger_transactions (status)`);
}

export async function registerUser(walletAddress) {
  const normalized = walletAddress.toLowerCase();

  if (!pool) {
    const existing = memoryUsers.get(normalized);
    if (existing) return existing;

    const user = {
      walletAddress: normalized,
      createdAt: new Date().toISOString()
    };

    memoryUsers.set(normalized, user);
    return user;
  }

  const result = await pool.query(
    `INSERT INTO users (wallet_address)
     VALUES ($1)
     ON CONFLICT (wallet_address)
     DO UPDATE SET wallet_address = EXCLUDED.wallet_address
     RETURNING wallet_address, created_at`,
    [normalized]
  );

  return result.rows[0];
}

const VALID_STATUSES = new Set([
  'pending',
  'submitted',
  'processing',
  'confirmed',
  'failed',
  'reversed',
  'recovered'
]);

export async function createLedgerTransaction({
  walletAddress = null,
  kind,
  asset,
  amountDelta,
  status = 'pending',
  network = null,
  provider = null,
  externalId = null,
  idempotencyKey = null,
  metadata = {}
}) {
  if (!kind) throw new Error('ledger kind is required');
  if (!asset) throw new Error('ledger asset is required');
  if (!VALID_STATUSES.has(status)) throw new Error(`Invalid ledger status: ${status}`);

  const id = randomUUID();
  const normalizedWallet = walletAddress ? walletAddress.toLowerCase() : null;
  const now = new Date().toISOString();

  if (!pool) {
    if (idempotencyKey) {
      for (const entry of memoryLedger.values()) {
        if (entry.idempotencyKey === idempotencyKey) return entry;
      }
    }

    const entry = {
      id,
      walletAddress: normalizedWallet,
      kind,
      asset,
      amountDelta: String(amountDelta),
      status,
      network,
      provider,
      externalId,
      idempotencyKey,
      metadata,
      createdAt: now,
      updatedAt: now,
      confirmedAt: status === 'confirmed' ? now : null
    };

    memoryLedger.set(id, entry);
    return entry;
  }

  const result = await pool.query(
    `INSERT INTO ledger_transactions
      (id, wallet_address, kind, asset, amount_delta, status, network,
       provider, external_id, idempotency_key, metadata, confirmed_at)
     VALUES
      ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb,
       CASE WHEN $6 = 'confirmed' THEN NOW() ELSE NULL END)
     ON CONFLICT (idempotency_key)
     DO UPDATE SET id = ledger_transactions.id
     RETURNING *`,
    [
      id,
      normalizedWallet,
      kind,
      asset,
      String(amountDelta),
      status,
      network,
      provider,
      externalId,
      idempotencyKey,
      JSON.stringify(metadata)
    ]
  );

  return result.rows[0];
}

export async function getLedgerTransactionByIdempotencyKey(idempotencyKey) {
  if (!idempotencyKey) return null;

  if (!pool) {
    for (const entry of memoryLedger.values()) {
      if (entry.idempotencyKey === idempotencyKey) return entry;
    }
    return null;
  }

  const result = await pool.query(
    'SELECT * FROM ledger_transactions WHERE idempotency_key = $1 LIMIT 1',
    [idempotencyKey]
  );

  return result.rows[0] || null;
}
export async function getLedgerTransaction(id) {
  if (!pool) {
    const entry = memoryLedger.get(id);
    if (!entry) throw new Error('Ledger transaction not found');
    return entry;
  }

  const result = await pool.query(
    `SELECT *
     FROM ledger_transactions
     WHERE id = $1
     LIMIT 1`,
    [id]
  );

  if (!result.rows[0]) throw new Error('Ledger transaction not found');
  return result.rows[0];
}
export async function updateLedgerTransaction(id, patch = {}) {
  if (!pool) {
    const current = memoryLedger.get(id);
    if (!current) throw new Error('Ledger transaction not found');

    if (patch.status && !VALID_STATUSES.has(patch.status)) {
      throw new Error(`Invalid ledger status: ${patch.status}`);
    }

    const updated = {
      ...current,
      ...patch,
      updatedAt: new Date().toISOString()
    };

    if (patch.status === 'confirmed' && !current.confirmedAt) {
      updated.confirmedAt = new Date().toISOString();
    }

    memoryLedger.set(id, updated);
    return updated;
  }

  const fields = [];
  const values = [id];
  let index = 2;

  for (const [key, column] of [
    ['status', 'status'],
    ['provider', 'provider'],
    ['externalId', 'external_id'],
    ['network', 'network']
  ]) {
    if (patch[key] !== undefined) {
      if (key === 'status' && !VALID_STATUSES.has(patch[key])) {
        throw new Error(`Invalid ledger status: ${patch[key]}`);
      }
      fields.push(`${column} = $${index++}`);
      values.push(patch[key]);
    }
  }

  if (patch.metadata !== undefined) {
    fields.push(`metadata = $${index++}::jsonb`);
    values.push(JSON.stringify(patch.metadata));
  }

  fields.push('updated_at = NOW()');

  if (patch.status === 'confirmed') {
    fields.push('confirmed_at = COALESCE(confirmed_at, NOW())');
  }

  const result = await pool.query(
    `UPDATE ledger_transactions
     SET ${fields.join(', ')}
     WHERE id = $1
     RETURNING *`,
    values
  );

  if (!result.rows[0]) throw new Error('Ledger transaction not found');
  return result.rows[0];
}

export async function listLedgerTransactions({ walletAddress = null, limit = 100 } = {}) {
  const safeLimit = Math.min(Math.max(Number(limit) || 100, 1), 500);
  const normalizedWallet = walletAddress ? walletAddress.toLowerCase() : null;

  if (!pool) {
    return [...memoryLedger.values()]
      .filter((entry) => !normalizedWallet || entry.walletAddress === normalizedWallet)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, safeLimit);
  }

  const values = [];
  let where = '';

  if (normalizedWallet) {
    values.push(normalizedWallet);
    where = 'WHERE wallet_address = $1';
  }

  values.push(safeLimit);

  const result = await pool.query(
    `SELECT *
     FROM ledger_transactions
     ${where}
     ORDER BY created_at DESC
     LIMIT $${values.length}`,
    values
  );

  return result.rows;
}

export async function getLedgerBalance({ walletAddress, asset }) {
  if (!walletAddress) throw new Error('walletAddress is required');
  if (!asset) throw new Error('asset is required');

  const normalizedWallet = walletAddress.toLowerCase();

  if (!pool) {
    let total = 0;

    for (const entry of memoryLedger.values()) {
      if (
        entry.walletAddress === normalizedWallet &&
        entry.asset.toUpperCase() === asset.toUpperCase() &&
        entry.status === 'confirmed'
      ) {
        total += Number(entry.amountDelta);
      }
    }

    return String(total);
  }

  const result = await pool.query(
    `SELECT COALESCE(SUM(amount_delta), 0) AS balance
     FROM ledger_transactions
     WHERE wallet_address = $1
       AND UPPER(asset) = UPPER($2)
       AND status = 'confirmed'`,
    [normalizedWallet, asset]
  );

  return String(result.rows[0].balance);
}
export async function createUpdate({ authorWallet, title = null, body, xUrl = null, imageUrl = null }) {
  if (!authorWallet || !body) throw new Error('authorWallet and body are required');
  const id = randomUUID(); const publishedAt = new Date().toISOString();
  const row = { id, authorWallet: authorWallet.toLowerCase(), title, body, xUrl, imageUrl, publishedAt };
  if (!pool) { memoryUpdates.set(id, row); return row; }
  const r = await pool.query(`INSERT INTO robank_updates (id,author_wallet,title,body,x_url,image_url,published_at) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`, [id,row.authorWallet,title,body,xUrl,imageUrl,publishedAt]);
  return r.rows[0];
}
export async function listUpdates({ limit = 50 } = {}) {
  const safe = Math.min(Math.max(Number(limit) || 50, 1), 100);
  if (!pool) return [...memoryUpdates.values()].sort((a,b) => b.publishedAt.localeCompare(a.publishedAt)).slice(0, safe);
  const r = await pool.query(`SELECT * FROM robank_updates ORDER BY published_at DESC LIMIT $1`, [safe]);
  return r.rows;
}
export async function deleteUpdate(id, authorWallet) {
  if (!pool) { const row = memoryUpdates.get(id); if (!row || row.authorWallet !== authorWallet.toLowerCase()) return null; memoryUpdates.delete(id); return row; }
  const r = await pool.query(`DELETE FROM robank_updates WHERE id=$1 AND author_wallet=$2 RETURNING *`, [id, authorWallet.toLowerCase()]);
  return r.rows[0] || null;
}
export async function createCompany({ ownerWallet, legalName, registrationNumber = null, countryCode = 'ID', metadata = {} }) {
  if (!ownerWallet || !legalName) throw new Error('ownerWallet and legalName are required');
  const id = randomUUID(); const now = new Date().toISOString();
  const row = { id, ownerWallet: ownerWallet.toLowerCase(), legalName, registrationNumber, countryCode, status:'draft', verificationStatus:'not_started', diditSessionId:null, metadata, createdAt:now, updatedAt:now };
  if (!pool) { memoryCompanies.set(id,row); return row; }
  const r = await pool.query(`INSERT INTO companies (id,owner_wallet,legal_name,registration_number,country_code,status,verification_status,metadata) VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb) RETURNING *`,[id,row.ownerWallet,legalName,registrationNumber,countryCode,row.status,row.verificationStatus,JSON.stringify(metadata)]);
  return r.rows[0];
}
export async function listCompanies(ownerWallet) {
  if (!ownerWallet) throw new Error('ownerWallet is required');
  const w=ownerWallet.toLowerCase();
  if (!pool) return [...memoryCompanies.values()].filter(c=>c.ownerWallet===w).sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
  const r=await pool.query(`SELECT * FROM companies WHERE owner_wallet=$1 ORDER BY created_at DESC`,[w]); return r.rows;
}
export async function getCompany(id) {
  if (!pool) return memoryCompanies.get(id) || null;
  const r=await pool.query(`SELECT * FROM companies WHERE id=$1 LIMIT 1`,[id]); return r.rows[0] || null;
}
export async function updateCompany(id, patch={}) {
  if (!pool){ const c=memoryCompanies.get(id); if(!c) return null; Object.assign(c, patch, {updatedAt:new Date().toISOString()}); memoryCompanies.set(id,c); return c; }
  const fields=[]; const values=[id]; let i=2;
  for (const [k,c] of [['status','status'],['verificationStatus','verification_status'],['diditSessionId','didit_session_id'],['registrationNumber','registration_number']]) if(patch[k]!==undefined){fields.push(`${c}=$${i++}`);values.push(patch[k]);}
  if (patch.metadata!==undefined){fields.push(`metadata=$${i++}::jsonb`);values.push(JSON.stringify(patch.metadata));}
  fields.push('updated_at=NOW()'); const r=await pool.query(`UPDATE companies SET ${fields.join(',')} WHERE id=$1 RETURNING *`,values); return r.rows[0] || null;
}
export async function createJob({creatorWallet,companyId=null,title,description,budgetAmount=null,budgetAsset=null,network=null,dueAt=null}) {
  if(!creatorWallet||!title||!description) throw new Error('creatorWallet, title and description are required');
  const id=randomUUID(); const row={id,creatorWallet:creatorWallet.toLowerCase(),companyId,title,description,budgetAmount,budgetAsset,network,status:'open',fundingStatus:'unfunded',workerWallet:null,submission:null,dueAt};
  if(!pool){ const now=new Date().toISOString(); const stored={...row,createdAt:now,updatedAt:now}; memoryJobs.set(id,stored); return stored; }
  const r=await pool.query(`INSERT INTO jobs (id,creator_wallet,company_id,title,description,budget_amount,budget_asset,network,status,funding_status,due_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'open','unfunded',$9) RETURNING *`,[id,row.creatorWallet,companyId,title,description,budgetAmount,budgetAsset,network,dueAt]); return r.rows[0];
}
export async function listJobs({status='open',creatorWallet=null,workerWallet=null,limit=100}={}) {
  const safe=Math.min(Math.max(Number(limit)||100,1),200); if(!pool) return [...memoryJobs.values()].filter(j=>(!status||j.status===status)&&(!creatorWallet||j.creatorWallet===creatorWallet.toLowerCase())&&(!workerWallet||j.workerWallet===workerWallet.toLowerCase())).sort((a,b)=>b.createdAt.localeCompare(a.createdAt)).slice(0,safe);
  const where=[]; const values=[]; let i=1; if(status){where.push(`status=$${i++}`);values.push(status)} if(creatorWallet){where.push(`creator_wallet=$${i++}`);values.push(creatorWallet.toLowerCase())} if(workerWallet){where.push(`worker_wallet=$${i++}`);values.push(workerWallet.toLowerCase())} values.push(safe);
  const r=await pool.query(`SELECT * FROM jobs ${where.length?'WHERE '+where.join(' AND '):''} ORDER BY created_at DESC LIMIT $${i}`,values); return r.rows;
}
export async function claimJob(id, workerWallet) { if(!pool){ const j=memoryJobs.get(id); if(!j||j.status!=='open'||j.fundingStatus!=='funded') return null; j.workerWallet=workerWallet.toLowerCase(); j.status='claimed'; j.updatedAt=new Date().toISOString(); memoryJobs.set(id,j); return j; } const r=await pool.query(`UPDATE jobs SET worker_wallet=$2,status='claimed',updated_at=NOW() WHERE id=$1 AND status='open' AND funding_status='funded' RETURNING *`,[id,workerWallet.toLowerCase()]); return r.rows[0] || null; }
export async function submitJob(id, workerWallet, submission) { if(!pool){ const j=memoryJobs.get(id); if(!j||j.workerWallet!==workerWallet.toLowerCase()||!['claimed','in_progress'].includes(j.status)) return null; j.submission=submission; j.status='submitted'; j.updatedAt=new Date().toISOString(); memoryJobs.set(id,j); return j; } const r=await pool.query(`UPDATE jobs SET submission=$3,status='submitted',updated_at=NOW() WHERE id=$1 AND worker_wallet=$2 AND status IN ('claimed','in_progress') RETURNING *`,[id,workerWallet.toLowerCase(),submission]); return r.rows[0] || null; }
export async function updateJobStatus(id, status, creatorWallet) {
  const normalized = String(status || '').toLowerCase();
  const allowed = new Set(['open','claimed','in_progress','submitted','approved','disputed','resolved','released','cancelled']);
  if (!allowed.has(normalized)) throw new Error('Invalid job status');

  const canTransition = (job) => {
    const current = job.status;
    const transitions = {
      open: new Set(['cancelled']),
      claimed: new Set(['in_progress','submitted','cancelled','disputed']),
      in_progress: new Set(['submitted','cancelled','disputed']),
      submitted: new Set(['approved','disputed']),
      approved: new Set(['released','disputed']),
      disputed: new Set(['resolved','cancelled']),
      resolved: new Set(['released','cancelled']),
      released: new Set([]),
      cancelled: new Set([])
    };
    return transitions[current]?.has(normalized);
  };

  if (!pool) {
    const j = memoryJobs.get(id);
    if (!j || j.creatorWallet !== creatorWallet.toLowerCase() || !canTransition(j)) return null;
    if (normalized === 'released' && j.fundingStatus !== 'funded') throw new Error('Cannot release an unfunded bounty');
    j.status = normalized;
    j.updatedAt = new Date().toISOString();
    memoryJobs.set(id, j);
    return j;
  }

  const existing = await pool.query('SELECT * FROM jobs WHERE id=$1 LIMIT 1', [id]);
  const j = existing.rows[0];
  if (!j || j.creator_wallet !== creatorWallet.toLowerCase() || !canTransition(j)) return null;
  if (normalized === 'released' && j.funding_status !== 'funded') throw new Error('Cannot release an unfunded bounty');
  const r = await pool.query('UPDATE jobs SET status=$2,updated_at=NOW() WHERE id=$1 AND creator_wallet=$3 RETURNING *', [id, normalized, creatorWallet.toLowerCase()]);
  return r.rows[0] || null;
}
