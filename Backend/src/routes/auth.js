import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { getUserByUsername, getUserById } from '../data/store.js';
import { generateToken, verifyToken, authenticate } from '../middleware/auth.js';

const router = Router();

router.post('/login', (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Benutzername und Passwort erforderlich' });
    }
    
    const user = getUserByUsername(username);
    if (!user) {
      return res.status(401).json({ error: 'Ungültige Anmeldedaten' });
    }
    
    const validPassword = bcrypt.compareSync(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Ungültige Anmeldedaten' });
    }
    
    const token = generateToken(user);
    
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000
    });
    
    res.json({
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        groupId: user.groupId
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Erfolgreich abgemeldet' });
});

router.get('/me', authenticate, (req, res) => {
  const user = getUserById(req.user.id);
  if (!user) {
    return res.status(404).json({ error: 'Benutzer nicht gefunden' });
  }
  
  res.json({
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      groupId: user.groupId
    }
  });
});

router.post('/check', (req, res) => {
  const token = req.cookies.token;
  
  if (!token) {
    return res.json({ authenticated: false });
  }
  
  const decoded = verifyToken(token);
  if (!decoded) {
    return res.json({ authenticated: false });
  }
  
  const user = getUserById(decoded.id);
  if (!user) {
    return res.json({ authenticated: false });
  }
  
  res.json({
    authenticated: true,
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      groupId: user.groupId
    }
  });
});

export default router;
