import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { getConfig, updateConfig, getGroups, getUsers } from '../data/store.js';

const router = Router();

router.get('/', authenticate, (req, res) => {
  const config = getConfig();
  const groups = getGroups();
  const athletes = getUsers().filter(u => u.role === 'athlete');
  
  const groupsWithCounts = groups.map(g => ({
    ...g,
    athleteCount: athletes.filter(a => a.groupId === g.id).length
  }));
  
  res.json({ config, groups: groupsWithCounts });
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
    
    if (updates.finaleSmallGroupMaxAthletes !== undefined) {
      if (!Number.isInteger(updates.finaleSmallGroupMaxAthletes) || updates.finaleSmallGroupMaxAthletes < 1) {
        return res.status(400).json({ error: 'Ungültige Anzahl für kleine Gruppen' });
      }
    }
    
    if (updates.finaleSmallGroupThreshold !== undefined) {
      if (!Number.isInteger(updates.finaleSmallGroupThreshold) || updates.finaleSmallGroupThreshold < 1) {
        return res.status(400).json({ error: 'Ungültige Schwelle für kleine Gruppen' });
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
