import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import {
  getRoutes,
  createRoute,
  updateRoute,
  deleteRoute
} from '../data/store.js';

const router = Router();

router.get('/', authenticate, requireAdmin, (req, res) => {
  const routes = getRoutes();
  res.json({ routes });
});

router.post('/', authenticate, requireAdmin, (req, res) => {
  try {
    const { name, category, points, order } = req.body;
    
    if (!name || !category || points === undefined) {
      return res.status(400).json({ error: 'Name, Kategorie und Punkte erforderlich' });
    }
    
    if (!['qualification', 'bonus', 'finale'].includes(category)) {
      return res.status(400).json({ error: 'Ungültige Kategorie' });
    }
    
    const route = createRoute(name, category, points, order);
    res.status(201).json({ route });
  } catch (error) {
    console.error('Create route error:', error);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

router.put('/:id', authenticate, requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    if (updates.category && !['qualification', 'bonus', 'finale'].includes(updates.category)) {
      return res.status(400).json({ error: 'Ungültige Kategorie' });
    }
    
    const route = updateRoute(id, updates);
    if (!route) {
      return res.status(404).json({ error: 'Route nicht gefunden' });
    }
    
    res.json({ route });
  } catch (error) {
    console.error('Update route error:', error);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

router.delete('/:id', authenticate, requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    
    const deleted = deleteRoute(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Route nicht gefunden' });
    }
    
    res.json({ message: 'Route gelöscht' });
  } catch (error) {
    console.error('Delete route error:', error);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

export default router;
