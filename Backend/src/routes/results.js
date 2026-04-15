import { Router } from 'express';
import {
  getRoutes,
  getUsers,
  getGroups,
  getCompletedRoutes,
  getConfig
} from '../data/store.js';

const router = Router();

router.get('/', (req, res) => {
  const config = getConfig();
  const groups = getGroups();
  const routes = getRoutes();
  const users = getUsers().filter(u => u.role === 'athlete' && u.groupId);
  const completed = getCompletedRoutes();
  
  const qualificationRoutes = routes.filter(r => r.category === 'qualification');
  const bonusRoutes = routes.filter(r => r.category === 'bonus');
  const bestCount = config.qualificationBestCount;
  
  const results = groups.map(group => {
    const groupUsers = users.filter(u => u.groupId === group.id);
    
    const athleteResults = groupUsers.map(user => {
      const userCompleted = completed.filter(cr => cr.userId === user.id);
      
      const qualResults = qualificationRoutes.map(route => {
        const completedEntry = userCompleted.find(cr => cr.routeId === route.id);
        return {
          routeId: route.id,
          name: route.name,
          points: route.points,
          result: completedEntry ? completedEntry.result : null
        };
      });
      
      const bonusResults = bonusRoutes.map(route => {
        const completedEntry = userCompleted.find(cr => cr.routeId === route.id);
        return {
          routeId: route.id,
          name: route.name,
          points: route.points,
          result: completedEntry ? completedEntry.result : null
        };
      });
      
      // Calculate points for qualification routes
      const qualWithResults = qualResults.map(r => ({
        ...r,
        isTop: r.result === 'top',
        isZone: r.result === 'zone'
      }));
      
      // Sort: tops first (by points desc), then zones (by points desc)
      const sortedQual = [...qualWithResults].sort((a, b) => {
        if (a.isTop && !b.isTop) return -1;
        if (!a.isTop && b.isTop) return 1;
        if (a.isZone && !b.isZone) return -1;
        if (!a.isZone && b.isZone) return 1;
        return b.points - a.points;
      });
      
      // Take best routes for scoring
      const bestQual = sortedQual.slice(0, bestCount);
      const qualTops = bestQual.filter(r => r.isTop).length;
      const qualZones = bestQual.filter(r => r.isZone && !r.isTop).length;
      const qualPoints = qualTops * 100 + qualZones * 50; // Tops = 100, Zones = 50
      
      // Bonus routes: count as number (can have multiple tops)
      const bonusTops = bonusResults.reduce((sum, r) => sum + (typeof r.result === 'number' ? r.result : (r.result === 'top' ? 1 : 0)), 0);
      const bonusPoints = bonusTops * 50;
      
      const totalTops = qualTops + bonusTops;
      const totalZones = qualZones;
      const totalPoints = qualPoints + bonusPoints;
      
      return {
        userId: user.id,
        username: user.username,
        qualTops,
        qualZones,
        bonusTops,
        qualPoints,
        bonusPoints,
        totalPoints,
        routes: qualResults
      };
    });
    
    const sortedAthletes = [...athleteResults].sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
      if (b.qualTops !== a.qualTops) return b.qualTops - a.qualTops;
      if (b.qualZones !== a.qualZones) return b.qualZones - a.qualZones;
      return b.bonusTops - a.bonusTops;
    });
    
    return {
      groupId: group.id,
      groupName: group.name,
      athletes: sortedAthletes
    };
  });
  
  res.json({ results, config });
});

export default router;
