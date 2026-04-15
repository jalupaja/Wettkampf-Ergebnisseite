import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import authRoutes from './routes/auth.js';
import usersRoutes from './routes/users.js';
import groupsRoutes from './routes/groups.js';
import routesRoutes from './routes/routes.js';
import finaleRoutes from './routes/finale.js';
import adminGroupsRoutes from './routes/adminGroups.js';
import adminRoutesRoutes from './routes/adminRoutes.js';
import resultsRoutes from './routes/results.js';
import configRoutes from './routes/config.js';

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

app.use(cors({
  origin: CORS_ORIGINS,
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

app.use('/api', authRoutes);
app.use('/api/Users', usersRoutes);
app.use('/api/Groups', groupsRoutes);
app.use('/api/Routes', routesRoutes);
app.use('/api/Finale', finaleRoutes);
app.use('/api/admin/Groups', adminGroupsRoutes);
app.use('/api/admin/Routes', adminRoutesRoutes);
app.use('/api/results', resultsRoutes);
app.use('/api/config', configRoutes);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server läuft auf http://0.0.0.0:${PORT}`);
  console.log(`Erlaubte CORS Origins: ${CORS_ORIGINS.join(', ')}`);
});
