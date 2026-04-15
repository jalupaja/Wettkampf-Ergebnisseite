import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { getGroups } from '../data/store.js';

const router = Router();

router.get('/', authenticate, (req, res) => {
  const groups = getGroups();
  res.json({ groups });
});

export default router;
