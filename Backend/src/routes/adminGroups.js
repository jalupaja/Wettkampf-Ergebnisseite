import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import {
  getGroups,
  createGroup,
  updateGroup,
  deleteGroup
} from '../data/store.js';

const router = Router();

router.get('/', authenticate, requireAdmin, (req, res) => {
  const groups = getGroups();
  res.json({ groups });
});

router.post('/', authenticate, requireAdmin, (req, res) => {
  try {
    const { name, description, order } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Name erforderlich' });
    }
    
    const group = createGroup(name, description, order);
    res.status(201).json({ group });
  } catch (error) {
    console.error('Create group error:', error);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

router.put('/:id', authenticate, requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const group = updateGroup(id, updates);
    if (!group) {
      return res.status(404).json({ error: 'Startklasse nicht gefunden' });
    }
    
    res.json({ group });
  } catch (error) {
    console.error('Update group error:', error);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

router.delete('/:id', authenticate, requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    
    const deleted = deleteGroup(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Startklasse nicht gefunden' });
    }
    
    res.json({ message: 'Startklasse gelöscht' });
  } catch (error) {
    console.error('Delete group error:', error);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

export default router;
