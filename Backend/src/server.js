import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import { initialize } from './data/store.js';
import authRoutes from './routes/auth.js';
import usersRoutes from './routes/users.js';
import groupsRoutes from './routes/groups.js';
import routesRoutes from './routes/routes.js';
import finaleRoutes from './routes/finale.js';
import adminGroupsRoutes from './routes/adminGroups.js';
import adminRoutesRoutes from './routes/adminRoutes.js';
import resultsRoutes from './routes/results.js';
import configRoutes from './routes/config.js';
import dataRoutes from './routes/dataRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

const CORS_ORIGINS = process.env.CORS_ORIGINS 
  ? process.env.CORS_ORIGINS.split(',') 
  : [
      'http://localhost:5173', 
      'http://localhost:5174', 
      'http://localhost:5175'
    ];

// Debug middleware to log Origin and preflight headers (helps diagnose CORS failures)
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    console.log(`[CORS DEBUG] Origin: ${origin} Method: ${req.method} Path: ${req.path}`);
  }
  if (req.method === 'OPTIONS') {
    console.log('[CORS DEBUG] Access-Control-Request-Headers:', req.headers['access-control-request-headers']);
  }
  next();
});

// If DEBUG_ALLOW_CORS is set, accept and echo back any origin (FOR DEBUG ONLY)
const DEBUG_ALLOW_CORS = process.env.DEBUG_ALLOW_CORS === 'true';
if (DEBUG_ALLOW_CORS) {
  console.warn('CORS DEBUG: permissive CORS enabled (DEBUG_ALLOW_CORS=true) - do not use in production');
  app.use(cors({
    origin: (origin, cb) => cb(null, origin || false),
    credentials: true
  }));
} else {
  app.use(cors({
    origin: CORS_ORIGINS,
    credentials: true
  }));
}
app.use(express.json());
app.use(cookieParser());

initialize().then(() => {
  console.log('Datenbank initialisiert');
  
  app.use('/api', authRoutes);
  app.use('/api/Users', usersRoutes);
  app.use('/api/Groups', groupsRoutes);
  app.use('/api/Finale', finaleRoutes);
  app.use('/api/admin/Groups', adminGroupsRoutes);
  app.use('/api/admin/Routes', adminRoutesRoutes);
  app.use('/api/Routes', routesRoutes);
  app.use('/api/results', resultsRoutes);
  app.use('/api/config', configRoutes);
  app.use('/api/admin/data', dataRoutes);
  
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });

  app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Serverfehler', details: err.message });
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server läuft auf http://0.0.0.0:${PORT}`);
    console.log(`Erlaubte CORS Origins: ${CORS_ORIGINS.join(', ')}`);
  });
});
