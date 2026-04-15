import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  getRoutes,
  getCompletedRoutes,
  setRouteResult
} from '../data/store.js';

const router = Router();

router.get('/', authenticate, (req, res) => {
  const routes = getRoutes();
  const completed = getCompletedRoutes();
  
  const userCompleted = completed.filter(cr => cr.userId === req.user.id);
  
  const routesWithStatus = routes.map(r => {
    const userResult = userCompleted.find(cr => cr.routeId === r.id);
    return {
      ...r,
      result: userResult ? userResult.result : null
    };
  });
  
  res.json({ routes: routesWithStatus });
});

router.post('/result', authenticate, (req, res) => {
  try {
    const { routeId, result } = req.body;
    
    if (!routeId) {
      return res.status(400).json({ error: 'Route-ID erforderlich' });
    }
    
    // Validate result value
    if (result !== null && !['zone', 'top'].includes(result)) {
      return res.status(400).json({ error: 'Ungültiges Ergebnis' });
    }
    
    const result_data = setRouteResult(req.user.id, routeId, result);
    res.json(result_data);
  } catch (error) {
    console.error('Set route result error:', error);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

export default router;
