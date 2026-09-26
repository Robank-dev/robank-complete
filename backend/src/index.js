import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import { initDatabase } from './services/database.js';
import users from './routes/users.js';
import payments from './routes/payments.js';
import agent from './routes/agent.js';
import onramp from './routes/onramp.js';
import assets from './routes/assets.js';
import autopilot from './routes/autopilot.js';
import card from './routes/card.js';
import companies from './routes/companies.js';
import jobs from './routes/jobs.js';
import markets from './routes/markets.js';
import kyc from './routes/kyc.js';
import updates from './routes/updates.js';
import agentMarket from './routes/agentMarket.js';
import lifi from './routes/lifi.js';
import onchainStocks from './routes/onchainStocks.js';
import { requirePrivyAuth } from './middleware/privyAuth.js';

const app = express();
app.disable('x-powered-by');
const allowedOrigins = new Set(
  (process.env.ROBANK_WEB_ORIGINS || 'https://robank.co,https://www.robank.co,http://localhost:3000')
    .split(',').map((value) => value.trim()).filter(Boolean)
);
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.has(origin)) return callback(null, true);
    return callback(null, false);
  },
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Idempotency-Key']
}));
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
});
app.use(express.json({ limit: '1mb' }));

app.get('/health', (_req, res) => res.json({ ok: true, service: 'robank-backend', mode: 'mvp' }));
app.use('/api', requirePrivyAuth);
app.use('/api/users', users);
app.use('/api/payments', payments);
app.use('/api/agent', agent);
app.use('/api/onramp', onramp);
app.use('/api/assets', assets);
app.use('/api/autopilot', autopilot);
app.use('/api/card', card);
app.use('/api/companies', companies);
app.use('/api/jobs', jobs);
app.use('/api/markets', markets);
app.use('/api/kyc', kyc);
app.use('/api/updates', updates);
app.use('/api/agent-market', agentMarket);
app.use('/api/lifi', lifi);
app.use('/api/stocks', onchainStocks);

initDatabase()
  .then(() => {
    app.listen(config.port, '0.0.0.0', () => {
      console.log(`ROBANK backend listening on http://localhost:${config.port}`);
    });
  })
  .catch((error) => {
    console.error('Database initialization failed:', error);
    process.exit(1);
  });
