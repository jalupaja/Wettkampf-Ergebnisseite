import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

function createDefaultData() {
  const adminPassword = bcrypt.hashSync('admin123', SALT_ROUNDS);
  
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
    { name: 'Klaus Müller', password: 'klaus123' },
    { name: 'Thomas Weber', password: 'thomas123' },
    { name: 'Stefan Bauer', password: 'stefan123' },
    { name: 'Maria Schmidt', password: 'maria123' },
    { name: 'Anna Fischer', password: 'anna123' },
    { name: 'Lisa Wagner', password: 'lisa123' },
    { name: 'Tim Hoffmann', password: 'tim123' },
    { name: 'Lena Klein', password: 'lena123' }
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
      hashed: true,
      role: 'admin',
      isSuperAdmin: true,
      groupId: null,
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
          routeId: routes[routeIndex].id,
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
          routeId: routes[routeIndex].id,
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
          routeId: bonusRoute.id,
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
      competitionState: 'qualification'
    }
  };
}

let store = createDefaultData();

export function getStore() {
  return store;
}

export function saveStore() {
  // In a real app, persist to file/database
}

export function getUsers() {
  return store.users;
}

export function getUserByUsername(username) {
  return store.users.find(u => u.username === username);
}

export function getUserById(id) {
  return store.users.find(u => u.id === id);
}

export function createUser(username, password, role, groupId = null) {
  const user = {
    id: uuidv4(),
    username,
    password: password,
    hashed: false,
    role,
    groupId: role === 'athlete' ? groupId : null,
    createdAt: new Date().toISOString()
  };
  store.users.push(user);
  saveStore();
  return user;
}

export function updateUser(id, updates) {
  const index = store.users.findIndex(u => u.id === id);
  if (index === -1) return null;
  
  if (updates.password) {
    updates.hashed = false;
  }
  
  store.users[index] = { ...store.users[index], ...updates };
  saveStore();
  return store.users[index];
}

export function deleteUser(id) {
  const index = store.users.findIndex(u => u.id === id);
  if (index === -1) return false;
  
  store.users.splice(index, 1);
  store.completedRoutes = store.completedRoutes.filter(cr => cr.userId !== id);
  saveStore();
  return true;
}

export function verifyPassword(user, password) {
  if (user.hashed) {
    return bcrypt.compareSync(password, user.password);
  }
  return user.password === password;
}

export function getGroups() {
  return [...store.groups].sort((a, b) => a.order - b.order);
}

export function getGroupById(id) {
  return store.groups.find(g => g.id === id);
}

export function createGroup(name, description = '', order = null) {
  if (order === null) {
    order = Math.max(...store.groups.map(g => g.order), 0) + 1;
  }
  const group = {
    id: uuidv4(),
    name,
    description,
    order,
    createdAt: new Date().toISOString()
  };
  store.groups.push(group);
  saveStore();
  return group;
}

export function updateGroup(id, updates) {
  const index = store.groups.findIndex(g => g.id === id);
  if (index === -1) return null;
  
  store.groups[index] = { ...store.groups[index], ...updates };
  saveStore();
  return store.groups[index];
}

export function deleteGroup(id) {
  const index = store.groups.findIndex(g => g.id === id);
  if (index === -1) return false;
  
  store.groups.splice(index, 1);
  store.users.forEach(u => {
    if (u.groupId === id) {
      u.groupId = null;
    }
  });
  saveStore();
  return true;
}

export function getRoutes() {
  return [...store.routes].sort((a, b) => a.order - b.order);
}

export function getRouteById(id) {
  return store.routes.find(r => r.id === id);
}

export function createRoute({ name, category, topPoints = 100, zones = [], order = null }) {
  if (order === null) {
    order = Math.max(...store.routes.map(r => r.order), 0) + 1;
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
  store.routes.push(route);
  saveStore();
  return route;
}

export function updateRoute(id, updates) {
  const index = store.routes.findIndex(r => r.id === id);
  if (index === -1) return null;
  
  store.routes[index] = { ...store.routes[index], ...updates };
  saveStore();
  return store.routes[index];
}

export function deleteRoute(id) {
  const index = store.routes.findIndex(r => r.id === id);
  if (index === -1) return false;
  
  store.routes.splice(index, 1);
  store.completedRoutes = store.completedRoutes.filter(cr => cr.routeId !== id);
  saveStore();
  return true;
}

export function getCompletedRoutes() {
  return store.completedRoutes;
}

export function setRouteResult(userId, routeId, result) {
  const existing = store.completedRoutes.find(
    cr => cr.userId === userId && cr.routeId === routeId
  );
  
  if (result === null) {
    if (existing) {
      store.completedRoutes = store.completedRoutes.filter(cr => cr !== existing);
    }
    saveStore();
    return { result: null };
  }
  
  if (existing) {
    existing.result = result;
    existing.completedAt = new Date().toISOString();
  } else {
    store.completedRoutes.push({
      id: uuidv4(),
      userId,
      routeId,
      result,
      completedAt: new Date().toISOString()
    });
  }
  saveStore();
  return { result };
}

export function setBonusResult(userId, routeId, count) {
  const existing = store.completedRoutes.find(
    cr => cr.userId === userId && cr.routeId === routeId
  );
  
  if (count === 0 || count === null) {
    if (existing) {
      store.completedRoutes = store.completedRoutes.filter(cr => cr !== existing);
    }
    saveStore();
    return { count: 0 };
  }
  
  if (existing) {
    existing.result = count;
    existing.completedAt = new Date().toISOString();
  } else {
    store.completedRoutes.push({
      id: uuidv4(),
      userId,
      routeId,
      result: count,
      completedAt: new Date().toISOString()
    });
  }
  saveStore();
  return { count };
}

export function getConfig() {
  return store.config;
}

export function updateConfig(updates) {
  store.config = { ...store.config, ...updates };
  saveStore();
  return store.config;
}

export function resetData() {
  store = createDefaultData();
  saveStore();
  return store;
}
