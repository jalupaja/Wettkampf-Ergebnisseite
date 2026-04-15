import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getGroups
} from '../data/store.js';

const router = Router();

router.get('/', authenticate, requireAdmin, (req, res) => {
  const users = getUsers();
  const groups = getGroups();
  
  const safeUsers = users.map(u => ({
    id: u.id,
    username: u.username,
    role: u.role,
    groupId: u.groupId,
    groupName: u.groupId ? groups.find(g => g.id === u.groupId)?.name : null,
    password: u.role === 'athlete' ? u.password : undefined,
    createdAt: u.createdAt
  }));
  
  res.json({ users: safeUsers });
});

router.post('/', authenticate, requireAdmin, (req, res) => {
  try {
    const { username, password, role, groupId } = req.body;
    
    if (!username || !password || !role) {
      return res.status(400).json({ error: 'Benutzername, Passwort und Rolle erforderlich' });
    }
    
    if (!['admin', 'athlete'].includes(role)) {
      return res.status(400).json({ error: 'Ungültige Rolle' });
    }
    
    if (role === 'athlete' && !groupId) {
      return res.status(400).json({ error: 'Athleten müssen einer Startklasse zugeordnet werden' });
    }
    
    const users = getUsers();
    if (users.some(u => u.username === username)) {
      return res.status(400).json({ error: 'Benutzername bereits vergeben' });
    }
    
    const user = createUser(username, password, role, groupId);
    
    res.status(201).json({
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        groupId: user.groupId,
        password: user.role === 'athlete' ? user.password : undefined
      }
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

router.put('/:id', authenticate, requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const user = updateUser(id, updates);
    if (!user) {
      return res.status(404).json({ error: 'Benutzer nicht gefunden' });
    }
    
    res.json({
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        groupId: user.groupId,
        password: user.role === 'athlete' ? user.password : undefined
      }
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

router.delete('/:id', authenticate, requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    
    if (req.user.id === id) {
      return res.status(400).json({ error: 'Cannot delete yourself' });
    }
    
    const deleted = deleteUser(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Benutzer nicht gefunden' });
    }
    
    res.json({ message: 'Benutzer gelöscht' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

export default router;
