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
  const finaleRoutes = routes.filter(r => r.category === 'finale');
  const bestCount = config.qualificationBestCount;
  
  const results = groups.map(group => {
    const groupUsers = users.filter(u => u.groupId === group.id);
    
    const athleteResults = groupUsers.map(user => {
      const userCompleted = completed.filter(cr => cr.userId === user.id);
      
      const qualResults = qualificationRoutes.map(route => {
        const completedEntry = userCompleted.find(cr => cr.routeName === route.name);
        return {
          name: route.name,
          topPoints: route.topPoints,
          zones: route.zones,
          result: completedEntry ? completedEntry.result : null
        };
      });
      
      const bonusResults = bonusRoutes.map(route => {
        const completedEntry = userCompleted.find(cr => cr.routeName === route.name);
        return {
          name: route.name,
          topPoints: route.topPoints,
          count: typeof completedEntry?.result === 'number' ? completedEntry.result : (completedEntry?.result === 'top' ? 1 : 0)
        };
      });
      
      const finaleResults = finaleRoutes.map(route => {
        const completedEntry = userCompleted.find(cr => cr.routeName === route.name);
        return {
          name: route.name,
          topPoints: route.topPoints,
          isTop: completedEntry?.result === 'top'
        };
      });
      
      const qualWithResults = qualResults.map(r => {
        let points = 0;
        let isTop = false;
        let zoneName = null;
        let zonePoints = 0;
        
        if (r.result === 'top') {
          isTop = true;
          points = r.topPoints;
        } else if (r.result && r.result !== 'top') {
          const zone = r.zones.find(z => z.name === r.result);
          if (zone) {
            zoneName = r.result;
            zonePoints = zone.points;
            points = zone.points;
          }
        }
        
        return { ...r, isTop, zoneName, zonePoints, points };
      });
      
      const sortedQual = [...qualWithResults].sort((a, b) => {
        if (a.isTop && !b.isTop) return -1;
        if (!a.isTop && b.isTop) return 1;
        if (a.zonePoints !== b.zonePoints) return b.zonePoints - a.zonePoints;
        return b.topPoints - a.topPoints;
      });
      
      const bestQual = sortedQual.slice(0, bestCount);
      const qualTops = bestQual.filter(r => r.isTop).length;
      const qualPoints = bestQual.reduce((sum, r) => sum + r.points, 0);
      
      const bonusTops = bonusResults.reduce((sum, r) => sum + r.count, 0);
      const bonusPoints = bonusTops * 50;
      
      const finaleTops = finaleResults.filter(r => r.isTop).length;
      const finalePoints = finaleResults.reduce((sum, r) => sum + (r.isTop ? r.topPoints : 0), 0);
      
      const totalTops = qualTops + bonusTops;
      const totalPoints = qualPoints + bonusPoints + finalePoints;
      
      return {
        userId: user.id,
        username: user.username,
        qualTops,
        qualPoints,
        bonusTops,
        bonusPoints,
        finaleTops,
        finalePoints,
        totalPoints,
        routes: qualResults,
        finaleRoutes: finaleResults
      };
    });
    
    const sortedAthletes = [...athleteResults].sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
      if (b.qualTops !== a.qualTops) return b.qualTops - a.qualTops;
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
