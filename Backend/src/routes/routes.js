import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  getRoutes,
  getRouteById,
  getCompletedRoutes,
  setRouteResult,
  setBonusResult
} from '../data/store.js';

const router = Router();

router.get('/', authenticate, (req, res) => {
  const routes = getRoutes();
  const completed = getCompletedRoutes();
  
  const userCompleted = completed.filter(cr => cr.userId === req.user.id);
  
  const routesWithStatus = routes.map(r => {
    const userResult = userCompleted.find(cr => cr.routeName === r.name);
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
    
    const route = getRouteById(routeId);
    if (!route) {
      return res.status(404).json({ error: 'Route nicht gefunden' });
    }
    
    const validResults = ['top', 'attempted', null];
    if (route.zones && route.zones.length > 0) {
      route.zones.forEach(z => validResults.push(z.name));
    }
    
    if (result !== null && !validResults.includes(result)) {
      return res.status(400).json({ error: `Ungültiges Ergebnis: ${result}` });
    }
    
    const result_data = setRouteResult(req.user.id, route.name, result);
    res.json(result_data);
  } catch (error) {
    console.error('Set route result error:', error);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

router.post('/bonus', authenticate, (req, res) => {
  try {
    const { routeId, count } = req.body;
    
    if (!routeId) {
      return res.status(400).json({ error: 'Route-ID erforderlich' });
    }
    
    if (typeof count !== 'number' || count < 0) {
      return res.status(400).json({ error: 'Ungültige Anzahl' });
    }
    
    const route = getRouteById(routeId);
    if (!route) {
      return res.status(404).json({ error: 'Route nicht gefunden' });
    }
    
    const result_data = setBonusResult(req.user.id, route.name, count);
    res.json(result_data);
  } catch (error) {
    console.error('Set bonus result error:', error);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

export default router;
