import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { getRoutes, getUsers, getCompletedRoutes, getConfig } from '../data/store.js';
import RouteCategories from '../../../shared/routeCategories.js';

const router = Router();

router.get('/', authenticate, (req, res) => {
  const finaleRoutes = getRoutes().filter(r => r.category === RouteCategories.FINALE);
  res.json({ routes: finaleRoutes });
});

export default router;
