import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { getRoutes, getUsers, getCompletedRoutes, getConfig } from '../data/store.js';

const router = Router();

router.get('/', authenticate, (req, res) => {
  const finaleRoutes = getRoutes().filter(r => r.category === 'finale');
  res.json({ routes: finaleRoutes });
});

export default router;
