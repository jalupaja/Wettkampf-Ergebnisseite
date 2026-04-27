import { Router } from 'express';
import { authenticate, requireAdminOrErgebnisdienst, requireAdmin } from '../middleware/auth.js';
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getGroups
} from '../data/store.js';

const router = Router();

router.get('/', authenticate, requireAdminOrErgebnisdienst, (req, res) => {
  const users = getUsers();
  const groups = getGroups();
  const visibleUsers = req.user.role === 'ergebnisdienst'
    ? users.filter(u => ['athlete', 'finalist'].includes(u.role))
    : users;
  
  const safeUsers = visibleUsers.map(u => ({
    id: u.id,
    username: u.username,
    password: u.password,
    role: u.role,
    isSuperAdmin: u.isSuperAdmin || false,
    groupId: u.groupId,
    groupName: u.groupId ? groups.find(g => g.id === u.groupId)?.name : null,
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
    
    if (!['admin', 'athlete', 'finalist', 'ergebnisdienst'].includes(role)) {
      return res.status(400).json({ error: 'Ungültige Rolle' });
    }
    if ((role === 'admin' || role === 'ergebnisdienst') && !req.user.isSuperAdmin) {
      return res.status(403).json({ error: 'Nur Super-Admin kann Administratoren/Ergebnisdienst erstellen' });
    }
    
    if ((role === 'athlete' || role === 'finalist') && !groupId) {
      return res.status(400).json({ error: 'Athleten und Finalisten müssen einer Startklasse zugeordnet werden' });
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
        password: user.password,
        role: user.role,
        isSuperAdmin: false,
        groupId: user.groupId,
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
    const allowedFields = ['username', 'password', 'role', 'groupId', 'isSuperAdmin', 'needsPasswordChange'];
    const updates = {};
    for (const key of allowedFields) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    if (typeof updates.username === 'string') {
      updates.username = updates.username.trim();
      if (!updates.username) return res.status(400).json({ error: 'Benutzername darf nicht leer sein' });
    }
    const targetUser = getUserById(id);
    
    if (!targetUser) {
      return res.status(404).json({ error: 'Benutzer nicht gefunden' });
    }
    
    // Check permissions for password changes on admin users
    if (updates.password && ['admin', 'ergebnisdienst'].includes(targetUser.role)) {
      // Only super-admin can change admin passwords
      if (!req.user.isSuperAdmin) {
        return res.status(403).json({ error: 'Nur Super-Admin kann Admin-Passwörter ändern' });
      }
    }
    
    if (updates.role && !['admin', 'athlete', 'finalist', 'ergebnisdienst'].includes(updates.role)) {
      return res.status(400).json({ error: 'Ungültige Rolle' });
    }
    if ((updates.role === 'admin' || updates.role === 'ergebnisdienst') && !req.user.isSuperAdmin && targetUser.role !== updates.role) {
      return res.status(403).json({ error: 'Nur Super-Admin kann Administratoren/Ergebnisdienst befördern' });
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
        password: user.password,
        role: user.role,
        isSuperAdmin: user.isSuperAdmin || false,
        groupId: user.groupId,
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
