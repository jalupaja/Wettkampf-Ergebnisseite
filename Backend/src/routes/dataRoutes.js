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
  getStore,
  saveStore,
  deleteAllRoutes,
  deleteAllGroups
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
          updates[key] = Number(String(req.body[key]).replace(',', '.')) || 0;
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

  const escapeCsv = (value) => {
    const str = String(value ?? '');
    return `"${str.replace(/"/g, '""')}"`;
  };

  const csv = [
    headers.join(','),
    ...routes.map(r => [
      escapeCsv(r.name),
      escapeCsv(r.category),
      escapeCsv(r.topPoints),
      escapeCsv(JSON.stringify(r.zones || []))
    ].join(','))
  ].join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="routes.csv"');
  res.send(csv);
});

router.post('/routes', authenticate, requireAdmin, (req, res) => {
  try {
    const { mode, data } = req.body;

    if (mode === 'replace') {
      deleteAllRoutes();
    }

    const results = [];
    data.forEach((row, index) => {
      try {
        let zones = [];
        if (row.zones) {
          if (Array.isArray(row.zones)) {
            zones = row.zones;
          } else {
            try {
              zones = JSON.parse(row.zones);
            } catch {
              zones = [];
            }
          }
          zones = zones.map(z => ({ ...z, points: Number(String(z.points).replace(",", ".")) || 0 }));
        }

        let rawTopPoints = String(row.topPoints || '').replace(',', '.');
        const topPointsNum = rawTopPoints ? Number(rawTopPoints) : NaN;
        const topPoints = Number.isFinite(topPointsNum) ? topPointsNum : (row.category === 'bonus' ? 50 : (row.category === 'finale' ? 0 : 100));

        if (mode === 'replace' || mode === 'append') {
          const currentRoutes = getRoutes();
          const existing = currentRoutes.find(r => r.name === row.name && r.category === row.category);
          if (existing) {
            const updated = updateRoute(existing.id, {
              topPoints,
              zones,
              order: index + 1
            });
            if (updated) {
              results.push({ name: row.name, action: 'updated' });
            } else {
              results.push({ name: row.name, error: 'Route konnte nicht aktualisiert werden' });
            }
          } else {
            createRoute({
              name: row.name,
              category: row.category || 'qualification',
              topPoints,
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
  const users = getUsers().filter(u => !['admin', 'schiedsrichter'].includes(u.role));
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
      const athleteIds = users.filter(u => ['athlete', 'finalist'].includes(u.role)).map(u => u.id);
      store.users = store.users.filter(u => ['admin', 'schiedsrichter'].includes(u.role));
      store.completedRoutes = store.completedRoutes.filter(cr => 
        users.find(u => u.id === cr.userId && ['admin', 'schiedsrichter'].includes(u.role))
      );
    }
    
    const results = [];
    for (const row of data) {
      if (!row.username || !row.role) continue;
      
      let group = null;
      if (row.groupName) {
        group = groups.find(g => g.name === row.groupName);
      }
      
      try {
      if (mode === 'replace' || mode === 'append') {
          const existing = users.find(u => u.username === row.username);
          const password = row.password ? row.password : generatePassword();
          if (existing) {
              if (['admin', 'schiedsrichter'].includes(existing.role)) continue;
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
                ['athlete', 'finalist', 'schiedsrichter', 'admin'].includes(row.role) ? row.role : 'athlete',
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
    const store = getStore();
    
    let preservedCount = 0;
    let deletedCount = 0;
    
    if (mode === 'replace') {
      const originalCount = getGroups().length;
      deleteAllGroups();
      preservedCount = 0;
      deletedCount = originalCount;
    }
    
    const results = [];
    data.forEach((row, index) => {
      try {
        if (mode === 'replace' || mode === 'append') {
          const existing = getGroups().find(g => g.name === row.name);
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
    
    const message = undefined; // success messages disabled per requirements
    
    res.json({ success: true, results, message });
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
    
    let prevChar = '';
    for (const char of lines[i]) {
      // Update prevChar for escaped quote check, but only if not processing an escape sequence
      if (char !== '\\') {
        // Handle escaped quote: two consecutive quotes inside quotes
        if (char === '"' && inQuotes && prevChar === '"') {
          current += '"';
          prevChar = '"';
          continue;
        }
        // Toggle quote state on unescaped quote
        if (char === '"') {
          inQuotes = !inQuotes;
        }
      }
      if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
      prevChar = char;
    }
    values.push(current.trim());
    
    const row = {};
    headers.forEach((h, idx) => {
      let val = values[idx] || '';
      // Remove surrounding quotes if present
      if (val.startsWith('"') && val.endsWith('"') && val.length >= 2) {
        val = val.slice(1, -1);
      }
      // Unescape CSV-escaped quotes ("" -> ")
      val = val.replace(/""/g, '"');
      row[h] = val;
    });
    data.push(row);
  }
  
  return data;
}

export default router;
