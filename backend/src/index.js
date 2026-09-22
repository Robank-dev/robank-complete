import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import { initDatabase } from './services/database.js';
import users from './routes/users.js';
import vault from './routes/vault.js';
import payments from './routes/payments.js';
import agent from './routes/agent.js';
import onramp from './routes/onramp.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/health', (_req, res) => res.json({ ok: true, service: 'robank-backend', mode: 'mvp' }));
app.use('/api/users', users);
app.use('/api/vault', vault);
app.use('/api/payments', payments);
app.use('/api/agent', agent);
app.use('/api/onramp', onramp);

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

