import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import { initDatabase } from './services/database.js';
import users from './routes/users.js';
import vault from './routes/vault.js';
import payments from './routes/payments.js';
import agent from './routes/agent.js';
import onramp from './routes/onramp.js';
import assets from './routes/assets.js';
import borrow from './routes/borrow.js';
import autopilot from './routes/autopilot.js';
import card from './routes/card.js';
import companies from './routes/companies.js';
import jobs from './routes/jobs.js';
import markets from './routes/markets.js';
import news from './routes/news.js';
import kyc from './routes/kyc.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/health', (_req, res) => res.json({ ok: true, service: 'robank-backend', mode: 'mvp' }));
app.use('/api/users', users);
app.use('/api/vault', vault);
app.use('/api/payments', payments);
app.use('/api/agent', agent);
app.use('/api/onramp', onramp);
app.use('/api/assets', assets);
app.use('/api/borrow', borrow);
app.use('/api/autopilot', autopilot);
app.use('/api/card', card);
app.use('/api/companies', companies);
app.use('/api/jobs', jobs);
app.use('/api/markets', markets);
app.use('/api/news', news);
app.use('/api/kyc', kyc);

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
