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

// Configure CORS. In production we prefer a strict allowlist provided
// by the CORS_ORIGINS environment variable. In development (no
// CORS_ORIGINS provided) we reflect the request origin so that local
// dev servers (Vite at various ports) can connect without brittle
// hard-coded port lists.
// Prepare CORS origins variable for logging and options. We keep the
// parsed allowlist in CORS_ORIGINS when provided, otherwise null to
// indicate development reflect-mode.
let corsOptions;
let CORS_ORIGINS = null;
if (process.env.CORS_ORIGINS) {
  CORS_ORIGINS = process.env.CORS_ORIGINS.split(',').map(origin => origin.trim());
  corsOptions = { origin: CORS_ORIGINS, credentials: true };
} else {
  // Development: reflect the incoming Origin header so browsers accept
  // requests from whatever local dev server port is being used.
  corsOptions = { origin: true, credentials: true };
}

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

// Diagnostic logging in development: capture incoming Origin and key headers
// to help troubleshoot CORS failures reported by browsers. This logs only in
// development (when CORS_ORIGINS is not set) to avoid verbose logs in prod.
if (!process.env.CORS_ORIGINS) {
  app.use((req, res, next) => {
    try {
      const origin = req.headers.origin || '<none>';
      const debug = {
        method: req.method,
        path: req.path,
        origin,
        headers: {
          'access-control-request-method': req.headers['access-control-request-method'] || undefined,
          'access-control-request-headers': req.headers['access-control-request-headers'] || undefined,
          'cookie': req.headers.cookie ? '<present>' : '<none>'
        }
      };
      console.log('[CORS DEBUG]', JSON.stringify(debug));
    } catch (e) {
      // noop
    }
    next();
  });
}

// When in development and we are reflecting origin (origin: true in cors
// options), some clients/browsers still expect explicit headers on
// preflight responses. Add a lightweight middleware to echo the Origin
// and required preflight headers to be explicit.
if (!process.env.CORS_ORIGINS) {
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Vary', 'Origin');
      if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE');
        const reqHeaders = req.headers['access-control-request-headers'];
        if (reqHeaders) res.setHeader('Access-Control-Allow-Headers', reqHeaders);
        return res.sendStatus(204);
      }
    }
    next();
  });
}

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

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server läuft auf http://0.0.0.0:${PORT}`);
    if (CORS_ORIGINS && CORS_ORIGINS.length) {
      console.log(`Erlaubte CORS Origins: ${CORS_ORIGINS.join(', ')}`);
    } else {
      console.log('Erlaubte CORS Origins: (dev) reflecting incoming Origin');
    }
  });

  // Graceful shutdown handler
  const gracefulShutdown = (signal) => {
    console.log(`\n${signal} empfangen, fahre Server herunter...`);
    
    server.close(() => {
      console.log('Server erfolgreich beendet');
      process.exit(0);
    });

    // Force exit after 10 seconds if graceful shutdown takes too long
    setTimeout(() => {
      console.error('Erzwungenes Beenden nach Timeout');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
});
