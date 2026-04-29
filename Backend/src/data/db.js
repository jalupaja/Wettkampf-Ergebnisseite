import initSqlJs from 'sql.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dataDir = join(__dirname, '..', 'data');
const dbPath = join(dataDir, 'wettkampf.db');

let db = null;
let SQL = null;

async function getSql() {
  if (!SQL) {
    SQL = await initSqlJs();
  }
  return SQL;
}

export async function initDatabase() {
  await getSql();
  
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true });
  }
  
  if (existsSync(dbPath)) {
    const buffer = readFileSync(dbPath);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }
  
  db.run(`
    CREATE TABLE IF NOT EXISTS groups (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      sort_order INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    )
  `);
  
  db.run(`
    CREATE TABLE IF NOT EXISTS routes (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      top_points INTEGER DEFAULT 100,
      zones TEXT DEFAULT '[]',
      sort_order INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    )
  `);
  
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      hashed INTEGER DEFAULT 0,
      role TEXT NOT NULL,
      is_super_admin INTEGER DEFAULT 0,
      group_id TEXT,
      needs_password_change INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    )
  `);
  
  db.run(`
    CREATE TABLE IF NOT EXISTS completed_routes (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      route_name TEXT NOT NULL,
      result TEXT NOT NULL,
      completed_at TEXT NOT NULL
    )
  `);
  
  db.run(`
    CREATE TABLE IF NOT EXISTS config (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `);
  
  saveToFile();
  
  return db;
}

export function getDb() {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

export function saveToFile() {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    writeFileSync(dbPath, buffer);
  }
}

export function closeDatabase() {
  if (db) {
    saveToFile();
    db.close();
    db = null;
  }
}

export async function migrateData(data) {
  const database = getDb();
  
  database.run('DELETE FROM completed_routes');
  database.run('DELETE FROM users');
  database.run('DELETE FROM routes');
  database.run('DELETE FROM groups');
  database.run('DELETE FROM config');
  
  for (const group of data.groups) {
    database.run(
      'INSERT INTO groups (id, name, description, sort_order, created_at) VALUES (?, ?, ?, ?, ?)',
      [group.id, group.name, group.description, group.order, group.createdAt]
    );
  }
  
  for (const route of data.routes) {
    database.run(
      'INSERT INTO routes (id, name, category, top_points, zones, sort_order, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [route.id, route.name, route.category, route.topPoints, JSON.stringify(route.zones), route.order, route.createdAt]
    );
  }
  
  for (const user of data.users) {
    database.run(
      'INSERT INTO users (id, username, password, hashed, role, is_super_admin, group_id, needs_password_change, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
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
  }
  
  for (const cr of data.completedRoutes) {
    database.run(
      'INSERT INTO completed_routes (id, user_id, route_name, result, completed_at) VALUES (?, ?, ?, ?, ?)',
      [cr.id, cr.userId, cr.routeName, cr.result, cr.completedAt]
    );
  }
  
  for (const [key, value] of Object.entries(data.config)) {
    database.run(
      'INSERT INTO config (key, value) VALUES (?, ?)',
      [key, JSON.stringify(value)]
    );
  }
  
  saveToFile();
}

export function isDatabaseEmpty() {
  const database = getDb();
  const result = database.exec('SELECT COUNT(*) as count FROM groups');
  return result[0]?.values[0]?.[0] === 0;
}

export { uuidv4 };