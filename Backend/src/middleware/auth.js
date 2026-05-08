import jwt from 'jsonwebtoken';
import { getUserById } from '../data/store.js';

import crypto from 'crypto';
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');

export function generateToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role, isSuperAdmin: user.isSuperAdmin || false },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

export function authenticate(req, res, next) {
  const token = req.cookies.token;
  
  if (!token) {
    return res.status(401).json({ error: 'Nicht authentifiziert' });
  }
  
  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ error: 'Account ungültig. Bitte Seite neu laden.' });
  }
  
  const user = getUserById(decoded.id);
  if (!user) {
    return res.status(401).json({ error: 'Benutzer nicht gefunden' });
  }
  
  req.user = user;
  next();
}

export function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin-Rechte erforderlich' });
  }
  next();
}

export function requireAdminOrErgebnisdienst(req, res, next) {
  if (!['admin', 'ergebnisdienst', 'schiedsrichter'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Admin- oder Schiedsrichter-Rechte erforderlich' });
  }
  next();
}

export function requireAthlete(req, res, next) {
  if (!['athlete', 'finalist'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Athleten-Rechte erforderlich' });
  }
  next();
}
