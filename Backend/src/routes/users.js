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
    isSuperAdmin: u.isSuperAdmin || false,
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
    const normalizedUsername = (username || '').trim();
    
    if (!normalizedUsername || !password || !role) {
      return res.status(400).json({ error: 'Benutzername, Passwort und Rolle erforderlich' });
    }
    
    if (!['admin', 'athlete'].includes(role)) {
      return res.status(400).json({ error: 'Ungültige Rolle' });
    }
    
    if (role === 'athlete' && !groupId) {
      return res.status(400).json({ error: 'Athleten müssen einer Startklasse zugeordnet werden' });
    }
    
    const users = getUsers();
    if (users.some(u => u.username === normalizedUsername)) {
      return res.status(400).json({ error: 'Benutzername bereits vergeben' });
    }
    
    const user = createUser(normalizedUsername, password, role, groupId);
    
    res.status(201).json({
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        isSuperAdmin: false,
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
    const updates = { ...req.body };
    if (typeof updates.username === 'string') {
      updates.username = updates.username.trim();
      if (!updates.username) return res.status(400).json({ error: 'Benutzername darf nicht leer sein' });
    }
    const targetUser = getUserById(id);
    
    if (!targetUser) {
      return res.status(404).json({ error: 'Benutzer nicht gefunden' });
    }
    
    // Check permissions for password changes on admin users
    if (updates.password && targetUser.role === 'admin') {
      // Only super-admin can change admin passwords
      if (!req.user.isSuperAdmin) {
        return res.status(403).json({ error: 'Nur Super-Admin kann Admin-Passwörter ändern' });
      }
    }
    
    // Regular admins cannot change super-admin password
    if (updates.password && targetUser.isSuperAdmin && req.user.id !== targetUser.id) {
      return res.status(403).json({ error: 'Keine Berechtigung' });
    }
    
    // Regular admins cannot promote to super-admin
    if (updates.isSuperAdmin && !req.user.isSuperAdmin) {
      delete updates.isSuperAdmin;
    }
    
    const user = updateUser(id, updates);
    
    res.json({
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        isSuperAdmin: user.isSuperAdmin || false,
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
    const targetUser = getUserById(id);
    
    if (!targetUser) {
      return res.status(404).json({ error: 'Benutzer nicht gefunden' });
    }
    
    // Cannot delete super-admin unless you are the super-admin
    if (targetUser.isSuperAdmin && !req.user.isSuperAdmin) {
      return res.status(403).json({ error: 'Keine Berechtigung' });
    }
    
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
