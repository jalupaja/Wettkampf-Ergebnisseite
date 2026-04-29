import { v4 as uuidv4 } from 'uuid';
import { getDb, initDatabase, isDatabaseEmpty, migrateData, saveToFile } from './db.js';

function loadDefaultData() {
  const adminPassword = 'ADMIN';
  
  const groups = [
    { id: uuidv4(), name: 'Herren', description: 'Männer allgemein', order: 1, createdAt: new Date().toISOString() },
    { id: uuidv4(), name: 'Damen', description: 'Frauen allgemein', order: 2, createdAt: new Date().toISOString() },
    { id: uuidv4(), name: 'Jugend m', description: 'Männliche Jugend', order: 3, createdAt: new Date().toISOString() },
    { id: uuidv4(), name: 'Jugend w', description: 'Weibliche Jugend', order: 4, createdAt: new Date().toISOString() }
  ];
  
  const routes = [
    { id: uuidv4(), name: 'Route 1', category: 'qualification', topPoints: 100, zones: [{name: 'Zone 1', points: 25}, {name: 'Zone 2', points: 50}], order: 1, createdAt: new Date().toISOString() },
    { id: uuidv4(), name: 'Route 2', category: 'qualification', topPoints: 100, zones: [{name: 'Zone 1', points: 25}, {name: 'Zone 2', points: 50}], order: 2, createdAt: new Date().toISOString() },
    { id: uuidv4(), name: 'Route 3', category: 'qualification', topPoints: 100, zones: [{name: 'Zone 1', points: 25}, {name: 'Zone 2', points: 50}], order: 3, createdAt: new Date().toISOString() },
    { id: uuidv4(), name: 'Route 4', category: 'qualification', topPoints: 100, zones: [{name: 'Zone 1', points: 25}, {name: 'Zone 2', points: 50}], order: 4, createdAt: new Date().toISOString() },
    { id: uuidv4(), name: 'Route 5', category: 'qualification', topPoints: 100, zones: [{name: 'Zone 1', points: 25}, {name: 'Zone 2', points: 50}], order: 5, createdAt: new Date().toISOString() },
    { id: uuidv4(), name: 'Route 6', category: 'qualification', topPoints: 100, zones: [{name: 'Zone 1', points: 25}, {name: 'Zone 2', points: 50}], order: 6, createdAt: new Date().toISOString() },
    { id: uuidv4(), name: 'Bonus 1', category: 'bonus', topPoints: 50, zones: [], order: 7, createdAt: new Date().toISOString() },
    { id: uuidv4(), name: 'Bonus 2', category: 'bonus', topPoints: 50, zones: [], order: 8, createdAt: new Date().toISOString() },
    { id: uuidv4(), name: 'Bonus 3', category: 'bonus', topPoints: 50, zones: [], order: 9, createdAt: new Date().toISOString() },
    { id: uuidv4(), name: 'Finale 1', category: 'finale', topPoints: 0, zones: [], order: 10, createdAt: new Date().toISOString() },
    { id: uuidv4(), name: 'Finale 2', category: 'finale', topPoints: 0, zones: [], order: 11, createdAt: new Date().toISOString() }
  ];
  
  const athletes = [
    { name: 'Klaus Müller', password: 'KLAUS123' },
    { name: 'Thomas Weber', password: 'THOMAS123' },
    { name: 'Stefan Bauer', password: 'STEFAN123' },
    { name: 'Maria Schmidt', password: 'MARIA123' },
    { name: 'Anna Fischer', password: 'ANNA123' },
    { name: 'Lisa Wagner', password: 'LISA123' },
    { name: 'Tim Hoffmann', password: 'TIM123' },
    { name: 'Lena Klein', password: 'LENA123' }
  ];

  const athleteResults = {
    'Klaus Müller': { tops: [0, 1, 2, 3], zones: {4: 'Zone 2'}, bonusTops: 2 },
    'Thomas Weber': { tops: [0, 1, 2], zones: {4: 'Zone 1'}, bonusTops: 1 },
    'Stefan Bauer': { tops: [0, 1], zones: {2: 'Zone 1', 3: 'Zone 2', 4: 'Zone 2'}, bonusTops: 3 },
    'Maria Schmidt': { tops: [0, 1, 2, 3], zones: {}, bonusTops: 2 },
    'Anna Fischer': { tops: [0, 1, 2], zones: {3: 'Zone 1'}, bonusTops: 1 },
    'Lisa Wagner': { tops: [0, 1], zones: {2: 'Zone 2', 3: 'Zone 1'}, bonusTops: 0 },
    'Tim Hoffmann': { tops: [0, 1, 2, 3, 4], zones: {}, bonusTops: 3 },
    'Lena Klein': { tops: [0, 1, 2, 3], zones: {}, bonusTops: 2 }
  };
  
  const users = [
    {
      id: uuidv4(),
      username: 'admin',
      password: adminPassword,
      hashed: false,
      role: 'admin',
      isSuperAdmin: true,
      groupId: null,
      needsPasswordChange: true,
      createdAt: new Date().toISOString()
    }
  ];
  
  const completedRoutes = [];
  
  Object.entries(athleteResults).forEach(([name, results]) => {
    const groupName = Object.entries({
      'Klaus Müller': 'Herren', 'Thomas Weber': 'Herren', 'Stefan Bauer': 'Herren',
      'Maria Schmidt': 'Damen', 'Anna Fischer': 'Damen', 'Lisa Wagner': 'Damen',
      'Tim Hoffmann': 'Jugend m', 'Lena Klein': 'Jugend w'
    }).find(([n]) => n === name)?.[1];
    const group = groups.find(g => g.name === groupName);
    if (!group) return;
    
    const userId = uuidv4();
    const athleteData = athletes.find(a => a.name === name);
    if (!athleteData) return;
    
    users.push({
      id: userId,
      username: name,
      password: athleteData.password,
      hashed: false,
      role: 'athlete',
      groupId: group.id,
      createdAt: new Date().toISOString()
    });
    
    results.tops.forEach(routeIndex => {
      if (routes[routeIndex]) {
        completedRoutes.push({
          id: uuidv4(),
          userId,
          routeName: routes[routeIndex].name,
          result: 'top',
          completedAt: new Date().toISOString()
        });
      }
    });
    
    Object.entries(results.zones).forEach(([routeIndexStr, zoneName]) => {
      const routeIndex = parseInt(routeIndexStr);
      if (routes[routeIndex]) {
        completedRoutes.push({
          id: uuidv4(),
          userId,
          routeName: routes[routeIndex].name,
          result: zoneName,
          completedAt: new Date().toISOString()
        });
      }
    });
    
    for (let i = 0; i < results.bonusTops; i++) {
      const bonusRoute = routes.find(r => r.category === 'bonus');
      if (bonusRoute) {
        completedRoutes.push({
          id: uuidv4(),
          userId,
          routeName: bonusRoute.name,
          result: 1,
          completedAt: new Date().toISOString()
        });
      }
    }
  });
  
  return {
    users,
    groups,
    routes,
    completedRoutes,
    config: {
      qualificationBestCount: 5,
      finaleMaxAthletes: 8,
      finaleSmallGroupMaxAthletes: 6,
      finaleSmallGroupThreshold: 10,
      competitionState: 'setup',
      rulesURL: ''
    }
  };
}

export async function initialize() {
  await initDatabase();
  
  if (isDatabaseEmpty()) {
    const defaultData = loadDefaultData();
    await migrateData(defaultData);
  }
}

export function getStore() {
  return {
    getUsers: () => getUsers(),
    getGroups: () => getGroups(),
    getRoutes: () => getRoutes(),
    getCompletedRoutes: () => getCompletedRoutes(),
    getConfig: () => getConfig()
  };
}

export function saveStore() {
  saveToFile();
}

export function getUsers() {
  const db = getDb();
  const result = db.exec('SELECT * FROM users');
  if (!result[0]) return [];
  
  const columns = result[0].columns;
  return result[0].values.map(row => {
    const obj = {};
    columns.forEach((col, i) => {
      if (col === 'hashed' || col === 'is_super_admin' || col === 'needs_password_change') {
        obj[col === 'hashed' ? 'hashed' : col === 'is_super_admin' ? 'isSuperAdmin' : 'needsPasswordChange'] = row[i] === 1;
      } else if (col === 'group_id') {
        obj.groupId = row[i];
      } else if (col === 'created_at') {
        obj.createdAt = row[i];
      } else {
        obj[col] = row[i];
      }
    });
    return obj;
  });
}

export function getUserByUsername(username) {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
  stmt.bind([username]);
  
  if (!stmt.step()) {
    stmt.free();
    return null;
  }
  
  const row = stmt.getAsObject();
  stmt.free();
  
  return {
    id: row.id,
    username: row.username,
    password: row.password,
    hashed: row.hashed === 1,
    role: row.role,
    isSuperAdmin: row.is_super_admin === 1,
    groupId: row.group_id,
    needsPasswordChange: row.needs_password_change === 1,
    createdAt: row.created_at
  };
}

export function getUserById(id) {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
  stmt.bind([id]);
  
  if (!stmt.step()) {
    stmt.free();
    return null;
  }
  
  const row = stmt.getAsObject();
  stmt.free();
  
  return {
    id: row.id,
    username: row.username,
    password: row.password,
    hashed: row.hashed === 1,
    role: row.role,
    isSuperAdmin: row.is_super_admin === 1,
    groupId: row.group_id,
    needsPasswordChange: row.needs_password_change === 1,
    createdAt: row.created_at
  };
}

export function createUser(username, password, role, groupId = null) {
  const db = getDb();
  const user = {
    id: uuidv4(),
    username,
    password,
    hashed: false,
    role,
    groupId: ['athlete', 'finalist'].includes(role) ? groupId : null,
    createdAt: new Date().toISOString()
  };
  
  db.run(
    `INSERT INTO users (id, username, password, hashed, role, is_super_admin, group_id, needs_password_change, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      user.id,
      user.username,
      user.password,
      user.hashed ? 1 : 0,
      user.role,
      user.isSuperAdmin ? 1 : 0,
      user.groupId,
      user.needsPasswordChange ? 1 : 0,
      user.createdAt
    ]
  );
  
  saveToFile();
  return user;
}

export function updateUser(id, updates) {
  const db = getDb();
  const existing = getUserById(id);
  if (!existing) return null;
  
  if (updates.password) {
    updates.needsPasswordChange = false;
    updates.hashed = false;
  }
  
  const fields = [];
  const values = [];
  
  if (updates.username !== undefined) { fields.push('username = ?'); values.push(updates.username); }
  if (updates.password !== undefined) { fields.push('password = ?'); values.push(updates.password); }
  if (updates.hashed !== undefined) { fields.push('hashed = ?'); values.push(updates.hashed ? 1 : 0); }
  if (updates.role !== undefined) { fields.push('role = ?'); values.push(updates.role); }
  if (updates.groupId !== undefined) { fields.push('group_id = ?'); values.push(updates.groupId); }
  if (updates.needsPasswordChange !== undefined) { fields.push('needs_password_change = ?'); values.push(updates.needsPasswordChange ? 1 : 0); }
  
  if (fields.length === 0) return existing;
  
  values.push(id);
  db.run(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values);
  
  saveToFile();
  return getUserById(id);
}

export function deleteUser(id) {
  const db = getDb();
  const existing = getUserById(id);
  if (!existing) return false;
  
  db.run('DELETE FROM users WHERE id = ?', [id]);
  db.run('DELETE FROM completed_routes WHERE user_id = ?', [id]);
  saveToFile();
  return true;
}

export function verifyPassword(user, password) {
  return user.password === password;
}

export function getGroups() {
  const db = getDb();
  const result = db.exec('SELECT * FROM groups ORDER BY sort_order');
  if (!result[0]) return [];
  
  const columns = result[0].columns;
  return result[0].values.map(row => {
    const obj = {};
    columns.forEach((col, i) => {
      if (col === 'sort_order') {
        obj.order = row[i];
      } else if (col === 'created_at') {
        obj.createdAt = row[i];
      } else {
        obj[col] = row[i];
      }
    });
    return obj;
  });
}

export function getGroupById(id) {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM groups WHERE id = ?');
  stmt.bind([id]);
  
  if (!stmt.step()) {
    stmt.free();
    return null;
  }
  
  const row = stmt.getAsObject();
  stmt.free();
  
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    order: row.sort_order,
    createdAt: row.created_at
  };
}

export function createGroup(name, description = '', order = null) {
  const db = getDb();
  
  if (order === null) {
    const result = db.exec('SELECT MAX(sort_order) as max FROM groups');
    order = (result[0]?.values[0]?.[0] || 0) + 1;
  }
  
  const group = {
    id: uuidv4(),
    name,
    description,
    order,
    createdAt: new Date().toISOString()
  };
  
  db.run(
    'INSERT INTO groups (id, name, description, sort_order, created_at) VALUES (?, ?, ?, ?, ?)',
    [group.id, group.name, group.description, group.order, group.createdAt]
  );
  
  saveToFile();
  return group;
}

export function updateGroup(id, updates) {
  const db = getDb();
  const existing = getGroupById(id);
  if (!existing) return null;
  
  const fields = [];
  const values = [];
  
  if (updates.name !== undefined) { fields.push('name = ?'); values.push(updates.name); }
  if (updates.description !== undefined) { fields.push('description = ?'); values.push(updates.description); }
  if (updates.order !== undefined) { fields.push('sort_order = ?'); values.push(updates.order); }
  
  if (fields.length === 0) return existing;
  
  values.push(id);
  db.run(`UPDATE groups SET ${fields.join(', ')} WHERE id = ?`, values);
  
  saveToFile();
  return getGroupById(id);
}

export function deleteGroup(id) {
  const db = getDb();
  const existing = getGroupById(id);
  if (!existing) return { success: false };
  
  const countResult = db.exec('SELECT COUNT(*) as count FROM users WHERE group_id = ?', [id]);
  const affectedUsers = countResult[0]?.values[0]?.[0] || 0;
  
  db.run('DELETE FROM groups WHERE id = ?', [id]);
  db.run('UPDATE users SET group_id = NULL WHERE group_id = ?', [id]);
  saveToFile();
  
  return { success: true, affectedUsers };
}

export function getRoutes() {
  const db = getDb();
  const result = db.exec('SELECT * FROM routes ORDER BY sort_order');
  if (!result[0]) return [];
  
  const columns = result[0].columns;
  return result[0].values.map(row => {
    const obj = {};
    columns.forEach((col, i) => {
      if (col === 'top_points') {
        obj.topPoints = row[i];
      } else if (col === 'sort_order') {
        obj.order = row[i];
      } else if (col === 'created_at') {
        obj.createdAt = row[i];
      } else {
        obj[col] = row[i];
      }
    });
    obj.zones = JSON.parse(obj.zones || '[]');
    return obj;
  });
}

export function getRouteById(id) {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM routes WHERE id = ?');
  stmt.bind([id]);
  
  if (!stmt.step()) {
    stmt.free();
    return null;
  }
  
  const row = stmt.getAsObject();
  stmt.free();
  
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    topPoints: row.top_points,
    zones: JSON.parse(row.zones),
    order: row.sort_order,
    createdAt: row.created_at
  };
}

export function createRoute({ name, category, topPoints = (category === 'bonus' ? 50 : (category === 'finale' ? 0 : 100)), zones = [], order = null }) {
  const db = getDb();
  
  if (order === null) {
    const result = db.exec('SELECT MAX(sort_order) as max FROM routes');
    order = (result[0]?.values[0]?.[0] || 0) + 1;
  }
  
  const route = {
    id: uuidv4(),
    name,
    category,
    topPoints,
    zones,
    order,
    createdAt: new Date().toISOString()
  };
  
  db.run(
    'INSERT INTO routes (id, name, category, top_points, zones, sort_order, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [route.id, route.name, route.category, route.topPoints, JSON.stringify(route.zones), route.order, route.createdAt]
  );
  
  saveToFile();
  return route;
}

export function updateRoute(id, updates) {
  const db = getDb();
  const existing = getRouteById(id);
  if (!existing) return null;
  
  const fields = [];
  const values = [];
  
  if (updates.name !== undefined) { fields.push('name = ?'); values.push(updates.name); }
  if (updates.category !== undefined) { fields.push('category = ?'); values.push(updates.category); }
  if (updates.topPoints !== undefined) { fields.push('top_points = ?'); values.push(updates.topPoints); }
  if (updates.zones !== undefined) { fields.push('zones = ?'); values.push(JSON.stringify(updates.zones)); }
  if (updates.order !== undefined) { fields.push('sort_order = ?'); values.push(updates.order); }
  
  if (fields.length === 0) return existing;
  
  values.push(id);
  db.run(`UPDATE routes SET ${fields.join(', ')} WHERE id = ?`, values);
  
  saveToFile();
  return getRouteById(id);
}

export function deleteRoute(id) {
  const db = getDb();
  const route = getRouteById(id);
  if (!route) return false;
  
  const routeName = route.name;
  db.run('DELETE FROM routes WHERE id = ?', [id]);
  db.run('DELETE FROM completed_routes WHERE route_name = ?', [routeName]);
  saveToFile();
  return true;
}

export function getCompletedRoutes() {
  const db = getDb();
  const result = db.exec('SELECT * FROM completed_routes');
  if (!result[0]) return [];
  
  const columns = result[0].columns;
  return result[0].values.map(row => {
    const obj = {};
    columns.forEach((col, i) => {
      if (col === 'user_id') {
        obj.userId = row[i];
      } else if (col === 'route_name') {
        obj.routeName = row[i];
      } else if (col === 'completed_at') {
        obj.completedAt = row[i];
      } else {
        obj[col] = row[i];
      }
    });
    return obj;
  });
}

export function setRouteResult(userId, routeName, result) {
  const db = getDb();
  
  const stmt = db.prepare('SELECT * FROM completed_routes WHERE user_id = ? AND route_name = ?');
  stmt.bind([userId, routeName]);
  const existing = stmt.step() ? stmt.getAsObject() : null;
  stmt.free();
  
  if (result === null) {
    if (existing) {
      db.run('DELETE FROM completed_routes WHERE id = ?', [existing.id]);
    }
    saveToFile();
    return { result: null };
  }
  
  if (existing) {
    db.run('UPDATE completed_routes SET result = ?, completed_at = ? WHERE id = ?', [result, new Date().toISOString(), existing.id]);
  } else {
    db.run(
      'INSERT INTO completed_routes (id, user_id, route_name, result, completed_at) VALUES (?, ?, ?, ?, ?)',
      [uuidv4(), userId, routeName, result, new Date().toISOString()]
    );
  }
  
  saveToFile();
  return { result };
}

export function setBonusResult(userId, routeName, count) {
  const db = getDb();
  
  const stmt = db.prepare('SELECT * FROM completed_routes WHERE user_id = ? AND route_name = ?');
  stmt.bind([userId, routeName]);
  const existing = stmt.step() ? stmt.getAsObject() : null;
  stmt.free();
  
  if (count === 0 || count === null) {
    if (existing) {
      db.run('DELETE FROM completed_routes WHERE id = ?', [existing.id]);
    }
    saveToFile();
    return { count: 0 };
  }
  
  if (existing) {
    db.run('UPDATE completed_routes SET result = ?, completed_at = ? WHERE id = ?', [count, new Date().toISOString(), existing.id]);
  } else {
    db.run(
      'INSERT INTO completed_routes (id, user_id, route_name, result, completed_at) VALUES (?, ?, ?, ?, ?)',
      [uuidv4(), userId, routeName, count, new Date().toISOString()]
    );
  }
  
  saveToFile();
  return { count };
}

export function getConfig() {
  const db = getDb();
  const result = db.exec('SELECT * FROM config');
  const config = {};
  
  if (result[0]) {
    for (const row of result[0].values) {
      config[row[0]] = JSON.parse(row[1]);
    }
  }
  
  return {
    qualificationBestCount: config.qualificationBestCount ?? 5,
    finaleMaxAthletes: config.finaleMaxAthletes ?? 8,
    finaleSmallGroupMaxAthletes: config.finaleSmallGroupMaxAthletes ?? 6,
    finaleSmallGroupThreshold: config.finaleSmallGroupThreshold ?? 10,
    competitionState: config.competitionState ?? 'setup',
    rulesUrl: config.rulesURL ?? ''
  };
}

export function updateUserRole(userId, newRole) {
  const db = getDb();
  db.run('UPDATE users SET role = ? WHERE id = ?', [newRole, userId]);
  saveToFile();
  return getUserById(userId);
}

export function updateConfig(updates) {
  const db = getDb();
  
  for (const [key, value] of Object.entries(updates)) {
    db.run(
      'INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)',
      [key, JSON.stringify(value)]
    );
  }
  
  saveToFile();
  return getConfig();
}

export async function resetData() {
  const defaultData = loadDefaultData();
  await migrateData(defaultData);
  return defaultData;
}