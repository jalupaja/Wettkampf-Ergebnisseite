import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { getConfig, updateConfig, getGroups, getUsers, updateUserRole } from '../data/store.js';
import CompetitionStates from '../../../shared/competitionStates.js';
import Roles from '../../../shared/roles.js';
import { calculateResults } from './results.js';

const router = Router();

router.get('/', authenticate, (req, res) => {
  const config = getConfig();
  const groups = getGroups();
  const athletes = getUsers().filter(u => ['athlete', 'finalist'].includes(u.role));
  
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
    
    if (updates.rulesURL !== undefined || updates.rulesUrl !== undefined) {
      const url = updates.rulesURL || updates.rulesUrl;
      if (typeof url !== 'string') {
        return res.status(400).json({ error: 'Ungültige URL für Regeln' });
      }
    }
    
    const previousConfig = getConfig();
    const config = updateConfig(updates);
    const transitionedToFinale = updates.competitionState === CompetitionStates.FINALE && previousConfig.competitionState !== CompetitionStates.FINALE;
    const transitionedOutOfFinale = previousConfig.competitionState === CompetitionStates.FINALE && updates.competitionState && updates.competitionState !== CompetitionStates.FINALE;
    
    if (transitionedOutOfFinale) {
      getUsers()
        .filter(u => u.role === Roles.FINALIST)
        .forEach(u => updateUserRole(u.id, Roles.ATHLETE));
    }
    
    if (transitionedToFinale) {
      getUsers()
        .filter(u => u.role === Roles.FINALIST)
        .forEach(u => updateUserRole(u.id, Roles.ATHLETE));

      const { results } = calculateResults();
      
    const threshold = config.finaleSmallGroupThreshold || 10;
    const maxAthletes = config.finaleMaxAthletes || 8;
    const smallGroupMax = config.finaleSmallGroupMaxAthletes || 6;
      
      for (const group of results) {
        const groupSize = group.athletes.length;
        let finalistCount = 0;
        
        if (groupSize < threshold) {
          finalistCount = Math.min(smallGroupMax, groupSize);
        } else {
          finalistCount = Math.min(maxAthletes, groupSize);
        }
        
        group.athletes.slice(0, finalistCount).forEach(athlete => {
          updateUserRole(athlete.userId, 'finalist');
        });
      }
    }
    
    res.json({ config });
  } catch (error) {
    console.error('Update config error:', error);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

export default router;
