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
  ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim())
  : [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5175',
      // Vite preview server default
      'http://localhost:4173'
    ];

app.use(cors({
  origin: CORS_ORIGINS,
  credentials: true
}));
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

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server läuft auf http://0.0.0.0:${PORT}`);
    console.log(`Erlaubte CORS Origins: ${CORS_ORIGINS.join(', ')}`);
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
