import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import {
  getRoutes,
  createRoute,
  updateRoute,
  deleteRoute
} from '../data/store.js';
import RouteCategories from 'shared/routeCategories.js';

const router = Router();

router.get('/', authenticate, requireAdmin, (req, res) => {
  const routes = getRoutes();
  res.json({ routes });
});

router.post('/', authenticate, requireAdmin, (req, res) => {
  try {
    console.log('POST /api/admin/Routes - body:', req.body);
    const { name, category, topPoints, zones, order } = req.body;
    
    if (!name || !category) {
      return res.status(400).json({ error: 'Name und Kategorie erforderlich', received: req.body });
    }
    
    if (![RouteCategories.QUALIFICATION, RouteCategories.BONUS, RouteCategories.FINALE].includes(category)) {
      return res.status(400).json({ error: 'Ungültige Kategorie' });
    }
    
    const normalizedTopPoints = topPoints !== undefined ? Number(String(topPoints).replace(',', '.')) : NaN;
    const normalizedZones = Array.isArray(zones)
      ? zones.map(z => ({ ...z, points: Number(String(z.points).replace(',', '.')) || 0 }))
      : [];

    const routeData = {
      name,
      category,
      topPoints: Number.isFinite(normalizedTopPoints) ? normalizedTopPoints : (category === RouteCategories.BONUS ? 50 : (category === RouteCategories.FINALE ? 0 : 100)),
      zones: normalizedZones,
      order
    };
    
    const route = createRoute(routeData);
    res.status(201).json({ route });
  } catch (error) {
    console.error('Create route error:', error);
    res.status(500).json({ error: 'Serverfehler', details: error.message });
  }
});

router.put('/:id', authenticate, requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };

    if (updates.topPoints !== undefined) {
      const n = Number(String(updates.topPoints).replace(',', '.'));
      if (!Number.isFinite(n)) return res.status(400).json({ error: 'Ungültige Top-Punkte' });
      updates.topPoints = n;
    }

    if (Array.isArray(updates.zones)) {
      updates.zones = updates.zones.map(z => ({ ...z, points: Number(String(z.points).replace(',', '.')) || 0 }));
    }

    if (updates.category && ![RouteCategories.QUALIFICATION, RouteCategories.BONUS, RouteCategories.FINALE].includes(updates.category)) {
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
