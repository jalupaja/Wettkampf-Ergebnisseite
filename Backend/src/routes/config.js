import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { getConfig, updateConfig } from '../data/store.js';

const router = Router();

router.get('/', authenticate, (req, res) => {
  const config = getConfig();
  res.json({ config });
});

router.put('/', authenticate, requireAdmin, (req, res) => {
  try {
    const updates = req.body;
    
    if (updates.qualificationBestCount !== undefined) {
      if (!Number.isInteger(updates.qualificationBestCount) || updates.qualificationBestCount < 1) {
        return res.status(400).json({ error: 'Ungültige Anzahl für Qualifikation' });
      }
    }
    
    if (updates.finaleMaxAthletes !== undefined) {
      if (!Number.isInteger(updates.finaleMaxAthletes) || updates.finaleMaxAthletes < 1) {
        return res.status(400).json({ error: 'Ungültige Anzahl für Finale' });
      }
    }
    
    const config = updateConfig(updates);
    res.json({ config });
  } catch (error) {
    console.error('Update config error:', error);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

export default router;
