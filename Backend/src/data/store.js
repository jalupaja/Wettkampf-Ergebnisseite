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
    { id: uuidv4(), name: 'Route 1', category: 'qualification', points: 100, order: 1, createdAt: new Date().toISOString() },
    { id: uuidv4(), name: 'Route 2', category: 'qualification', points: 100, order: 2, createdAt: new Date().toISOString() },
    { id: uuidv4(), name: 'Route 3', category: 'qualification', points: 100, order: 3, createdAt: new Date().toISOString() },
    { id: uuidv4(), name: 'Route 4', category: 'qualification', points: 100, order: 4, createdAt: new Date().toISOString() },
    { id: uuidv4(), name: 'Route 5', category: 'qualification', points: 100, order: 5, createdAt: new Date().toISOString() },
    { id: uuidv4(), name: 'Route 6', category: 'qualification', points: 100, order: 6, createdAt: new Date().toISOString() },
    { id: uuidv4(), name: 'Bonus 1', category: 'bonus', points: 50, order: 7, createdAt: new Date().toISOString() },
    { id: uuidv4(), name: 'Bonus 2', category: 'bonus', points: 50, order: 8, createdAt: new Date().toISOString() },
    { id: uuidv4(), name: 'Bonus 3', category: 'bonus', points: 50, order: 9, createdAt: new Date().toISOString() },
    { id: uuidv4(), name: 'Finale 1', category: 'finale', points: 0, order: 10, createdAt: new Date().toISOString() },
    { id: uuidv4(), name: 'Finale 2', category: 'finale', points: 0, order: 11, createdAt: new Date().toISOString() }
  ];
  
  const athletes = [
    { name: 'Klaus Müller', password: 'Klaus123', group: 'Herren', tops: [0, 1, 2, 3], zones: [], bonusTops: 2 },
    { name: 'Thomas Weber', password: 'Thomas123', group: 'Herren', tops: [0, 1, 2], zones: [4], bonusTops: 1 },
    { name: 'Stefan Bauer', password: 'Stefan123', group: 'Herren', tops: [0, 1], zones: [2, 3, 4], bonusTops: 3 },
    { name: 'Maria Schmidt', password: 'Maria123', group: 'Damen', tops: [0, 1, 2, 3], zones: [], bonusTops: 2 },
    { name: 'Anna Fischer', password: 'Anna123', group: 'Damen', tops: [0, 1, 2], zones: [3], bonusTops: 1 },
    { name: 'Lisa Wagner', password: 'Lisa123', group: 'Damen', tops: [0, 1], zones: [2, 3], bonusTops: 0 },
    { name: 'Tim Hoffmann', password: 'Tim123', group: 'Jugend m', tops: [0, 1, 2, 3, 4], zones: [], bonusTops: 3 },
    { name: 'Lena Klein', password: 'Lena123', group: 'Jugend w', tops: [0, 1, 2, 3], zones: [], bonusTops: 2 }
  ];
  
  const users = [
    {
      id: uuidv4(),
      username: 'admin',
      password: adminPassword,
      hashed: true,
      role: 'admin',
      groupId: null,
      createdAt: new Date().toISOString()
    }
  ];
  
  const completedRoutes = [];
  
  athletes.forEach(athlete => {
    const group = groups.find(g => g.name === athlete.group);
    if (!group) return;
    
    const userId = uuidv4();
    users.push({
      id: userId,
      username: athlete.name,
      password: athlete.password,
      hashed: false,
      role: 'athlete',
      groupId: group.id,
      createdAt: new Date().toISOString()
    });
    
    athlete.tops.forEach(routeIndex => {
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
    
    athlete.zones.forEach(routeIndex => {
      if (routes[routeIndex]) {
        completedRoutes.push({
          id: uuidv4(),
          userId,
          routeId: routes[routeIndex].id,
          result: 'zone',
          completedAt: new Date().toISOString()
        });
      }
    });
    
    for (let i = 0; i < athlete.bonusTops; i++) {
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

export function createRoute(name, category, points, order = null) {
  if (order === null) {
    order = Math.max(...store.routes.map(r => r.order), 0) + 1;
  }
  const route = {
    id: uuidv4(),
    name,
    category,
    points,
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
