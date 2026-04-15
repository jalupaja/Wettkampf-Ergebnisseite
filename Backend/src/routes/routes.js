import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  getRoutes,
  getCompletedRoutes,
  toggleCompletedRoute
} from '../data/store.js';

const router = Router();

router.get('/', authenticate, (req, res) => {
  const routes = getRoutes();
  const completed = getCompletedRoutes();
  
  const userCompleted = completed
    .filter(cr => cr.userId === req.user.id)
    .map(cr => cr.routeId);
  
  const routesWithStatus = routes.map(r => ({
    ...r,
    completed: userCompleted.includes(r.id)
  }));
  
  res.json({ routes: routesWithStatus });
});

router.post('/toggle', authenticate, (req, res) => {
  try {
    const { routeId } = req.body;
    
    if (!routeId) {
      return res.status(400).json({ error: 'Route-ID erforderlich' });
    }
    
    const result = toggleCompletedRoute(req.user.id, routeId);
    res.json(result);
  } catch (error) {
    console.error('Toggle route error:', error);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

export default router;
