import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import {
  getConfig,
  getRoutes,
  getUsers,
  getGroups,
  getCompletedRoutes,
  updateConfig,
  createRoute,
  updateRoute,
  createUser,
  updateUser,
  createGroup,
  updateGroup,
  getGroupById,
  getStore
} from '../data/store.js';

const router = Router();

function generatePassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let result = '';
  for (let i = 0; i < 5; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

router.get('/config', authenticate, requireAdmin, (req, res) => {
  const config = getConfig();
  const csv = `key,value\n${Object.entries(config).map(([k, v]) => `${k},${v}`).join('\n')}`;
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="config.csv"');
  res.send(csv);
});

router.post('/config', authenticate, requireAdmin, (req, res) => {
  try {
    const config = getConfig();
    const updates = {};
    Object.keys(config).forEach(key => {
      if (req.body[key] !== undefined) {
        if (typeof config[key] === 'number') {
          updates[key] = parseInt(req.body[key]) || 0;
        } else {
          updates[key] = req.body[key];
        }
      }
    });
    const updated = updateConfig(updates);
    res.json({ success: true, config: updated });
  } catch (error) {
    console.error('Import config error:', error);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

router.get('/routes', authenticate, requireAdmin, (req, res) => {
  const routes = getRoutes();
  const headers = ['name', 'category', 'topPoints', 'zones'];
  const csv = [
    headers.join(','),
    ...routes.map(r => [
      `"${r.name}"`,
      r.category,
      r.topPoints,
      `"${JSON.stringify(r.zones || [])}"`
    ].join(','))
  ].join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="routes.csv"');
  res.send(csv);
});

router.post('/routes', authenticate, requireAdmin, (req, res) => {
  try {
    const { mode, data } = req.body;
    const routes = getRoutes();
    
    if (mode === 'replace') {
      const idsToDelete = routes.map(r => r.id);
      const store = getStore();
      store.routes = store.routes.filter(r => !idsToDelete.includes(r.id));
    }
    
    const results = [];
    data.forEach((row, index) => {
      try {
        let zones = [];
        if (row.zones) {
          try {
            zones = JSON.parse(row.zones);
          } catch {
            zones = [];
          }
        }
        
        if (mode === 'replace' || mode === 'append') {
          const existing = routes.find(r => r.name === row.name && r.category === row.category);
          if (existing) {
            const updated = updateRoute(existing.id, {
              topPoints: parseInt(row.topPoints) || 100,
              zones,
              order: index + 1
            });
            results.push({ name: row.name, action: 'updated' });
          } else {
            const created = createRoute({
              name: row.name,
              category: row.category || 'qualification',
              topPoints: parseInt(row.topPoints) || 100,
              zones,
              order: index + 1
            });
            results.push({ name: row.name, action: 'created' });
          }
        }
      } catch (err) {
        results.push({ name: row.name || 'Unknown', error: err.message });
      }
    });
    
    res.json({ success: true, results });
  } catch (error) {
    console.error('Import routes error:', error);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

router.get('/users', authenticate, requireAdmin, (req, res) => {
  const users = getUsers().filter(u => u.role !== 'admin');
  const groups = getGroups();
  const completed = getCompletedRoutes();
  
  const headers = ['username', 'password', 'role', 'groupName', 'results'];
  const csvRows = [headers.join(',')];
  
  for (const user of users) {
    const group = user.groupId ? groups.find(g => g.id === user.groupId) : null;
    const userResults = completed.filter(cr => cr.userId === user.id);
    const resultsStr = JSON.stringify(userResults.map(r => ({ routeName: r.routeName, result: r.result })));
    
    csvRows.push([
      `"${user.username}"`,
      user.password || '',
      user.role,
      `"${group?.name || ''}"`,
      `"${resultsStr.replace(/"/g, '""')}"`
    ].join(','));
  }
  
  const csv = csvRows.join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="users.csv"');
  res.send(csv);
});

router.post('/users', authenticate, requireAdmin, (req, res) => {
  try {
    const { mode, data } = req.body;
    const users = getUsers();
    const groups = getGroups();
    const completed = getCompletedRoutes();
    
    if (mode === 'replace') {
      const store = getStore();
      const athleteIds = users.filter(u => u.role === 'athlete').map(u => u.id);
      store.users = store.users.filter(u => u.role === 'admin');
      store.completedRoutes = store.completedRoutes.filter(cr => 
        users.find(u => u.id === cr.userId && u.role === 'admin')
      );
    }
    
    const results = [];
    for (const row of data) {
      try {
        const group = groups.find(g => g.name === row.groupName);
        
        if (mode === 'replace' || mode === 'append') {
          const existing = users.find(u => u.username === row.username);
          const password = row.password ? row.password : generatePassword();
          if (existing) {
            const updates = { groupId: group?.id || null };
            if (row.password) {
              updates.password = password;
            }
            updateUser(existing.id, updates);
            results.push({ username: row.username, password: row.password ? undefined : password, action: 'updated' });
          } else {
            createUser(
              row.username,
              password,
              row.role || 'athlete',
              group?.id || null
            );
            results.push({ username: row.username, password: row.password ? undefined : password, action: 'created' });
          }
        }
      } catch (err) {
        results.push({ username: row.username || 'Unknown', error: err.message });
      }
    }
    
    res.json({ success: true, results });
  } catch (error) {
    console.error('Import users error:', error);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

router.get('/groups', authenticate, requireAdmin, (req, res) => {
  const groups = getGroups();
  const csv = [
    'name,description',
    ...groups.map(g => `"${g.name}","${g.description || ''}"`)
  ].join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="groups.csv"');
  res.send(csv);
});

router.post('/groups', authenticate, requireAdmin, (req, res) => {
  try {
    const { mode, data } = req.body;
    const groups = getGroups();
    
    if (mode === 'replace') {
      const store = getStore();
      store.groups = store.groups.filter(g => {
        const hasAthletes = store.users.some(u => u.groupId === g.id && u.role === 'athlete');
        return hasAthletes;
      });
    }
    
    const results = [];
    data.forEach((row, index) => {
      try {
        if (mode === 'replace' || mode === 'append') {
          const existing = groups.find(g => g.name === row.name);
          if (existing) {
            updateGroup(existing.id, {
              description: row.description || '',
              order: index + 1
            });
            results.push({ name: row.name, action: 'updated' });
          } else {
            createGroup(
              row.name,
              row.description || '',
              index + 1
            );
            results.push({ name: row.name, action: 'created' });
          }
        }
      } catch (err) {
        results.push({ name: row.name || 'Unknown', error: err.message });
      }
    });
    
    res.json({ success: true, results });
  } catch (error) {
    console.error('Import groups error:', error);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

function parseCSV(text) {
  const lines = text.split('\n').filter(l => l.trim());
  if (lines.length < 2) return [];
  
  const headers = lines[0].split(',').map(h => h.trim());
  const data = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (const char of lines[i]) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    
    const row = {};
    headers.forEach((h, idx) => {
      let val = values[idx] || '';
      if (val.startsWith('"') && val.endsWith('"')) {
        val = val.slice(1, -1).replace(/""/g, '"');
      }
      row[h] = val;
    });
    data.push(row);
  }
  
  return data;
}

export default router;
