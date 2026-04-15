import jwt from 'jsonwebtoken';
import { getUserById } from '../data/store.js';

const JWT_SECRET = process.env.JWT_SECRET || 'wettkampf-secret-key-2024';

export function generateToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role },
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
    return res.status(401).json({ error: 'Ungültiges Token' });
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

export function requireAthlete(req, res, next) {
  if (req.user.role !== 'athlete') {
    return res.status(403).json({ error: 'Athleten-Rechte erforderlich' });
  }
  next();
}
