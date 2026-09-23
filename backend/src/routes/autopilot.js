import { Router } from 'express';
import { getAgentSchedulerStatus } from '../services/agentScheduler.js';

const router = Router();

router.get('/status', (_req, res) => {
  res.json({
    autopilot: {
      status: 'available',
      mode: 'scheduler-backed',
    },
    scheduler: getAgentSchedulerStatus(),
  });
});

export default router;
