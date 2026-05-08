import { Router } from 'express';
import {
  getRoutes,
  getUsers,
  getGroups,
  getCompletedRoutes,
  getConfig
} from '../data/store.js';

function parseTimeToSeconds(timeStr) {
  if (!timeStr) return Infinity;
  const parts = String(timeStr).split(':');
  if (parts.length === 2) {
    const minutes = parseInt(parts[0], 10);
    const seconds = parseFloat(parts[1]);
    return minutes * 60 + seconds;
  }
  const seconds = parseFloat(timeStr);
  return Number.isFinite(seconds) ? seconds : Infinity;
}

export function calculateResults() {
  const config = getConfig();
  const groups = getGroups();
  const routes = getRoutes();
  const users = getUsers().filter(u => ['athlete', 'finalist'].includes(u.role) && u.groupId);
  const completed = getCompletedRoutes();
  
  const qualificationRoutes = routes.filter(r => r.category === 'qualification');
  const bonusRoutes = routes.filter(r => r.category === 'bonus');
  const finaleRoutes = routes.filter(r => r.category === 'finale');
  // Ensure qualification best count is a sane integer (fallback to 4)
  const bestCount = Number.isFinite(Number(config.qualificationBestCount))
    ? Math.max(1, Math.floor(Number(config.qualificationBestCount)))
    : 4;
  // Do not allow bestCount greater than available qualification routes
  const effectiveBestCount = Math.min(bestCount, Math.max(0, qualificationRoutes.length));
  
  const results = groups.map(group => {
    const groupUsers = users.filter(u => u.groupId === group.id);
    
      const athleteResults = groupUsers.map(user => {
      const userCompleted = completed.filter(cr => cr.userId === user.id);
      
      const qualResults = qualificationRoutes.map(route => {
        const completedEntry = userCompleted.find(cr => cr.routeName === route.name);
        return {
          name: route.name,
          topPoints: Number(route.topPoints) || 0,
          zones: route.zones,
          result: completedEntry ? completedEntry.result : null
        };
      });
      
      const bonusResults = bonusRoutes.map(route => {
        const completedEntry = userCompleted.find(cr => cr.routeName === route.name && (typeof cr.result === 'number' || cr.result === 'top'));
        return {
          name: route.name,
          topPoints: Number(route.topPoints) || 0,
          count: typeof completedEntry?.result === 'number' ? completedEntry.result : (completedEntry?.result === 'top' ? 1 : 0)
        };
      });
      
      const finaleResults = finaleRoutes.map(route => {
        const completedEntry = userCompleted.find(cr => cr.routeName === route.name);
        let points = 0;
        let time = null;
        let isTop = false;
        let zoneName = null;
        let zonePoints = 0;
        
        const resultValue = completedEntry?.result;
        
        if (resultValue !== undefined && resultValue !== null) {
          let finaleData = {};
          
          // Parse JSON finale result if applicable
          if (typeof resultValue === 'string' && resultValue.startsWith('{')) {
            try {
              finaleData = JSON.parse(resultValue);
            } catch (e) {
              // Fall back to numeric parsing
              const numResult = Number(String(resultValue).replace(',', '.'));
              points = Number.isFinite(numResult) ? numResult : 0;
            }
          } else {
            const numResult = typeof resultValue === 'number' ? resultValue : Number(String(resultValue).replace(',', '.'));
            points = Number.isFinite(numResult) ? numResult : 0;
          }
          
          // If we parsed JSON, extract points and time from it
          if (finaleData.points !== undefined) {
            points = Number(finaleData.points);
          }
          if (finaleData.time !== undefined) {
            time = finaleData.time;
          }
          
          if (Number.isFinite(points)) {
            isTop = Number(route.topPoints) > 0 && points >= Number(route.topPoints);
          }
        }
        
        return {
          name: route.name,
          topPoints: route.topPoints,
          zones: route.zones,
          isTop,
          zoneName,
          zonePoints,
          points,
          time
        };
      });
      
      const qualWithResults = qualResults.map(r => {
        let points = 0;
        let isTop = false;
        let zoneName = null;
        let zonePoints = 0;
        
        if (r.result === 'top') {
          isTop = true;
          points = Number(r.topPoints) || 0;
        } else if (r.result && r.result !== 'top') {
          const zone = r.zones.find(z => z.name === r.result);
          if (zone) {
            zoneName = r.result;
            zonePoints = zone.points;
            points = Number(zone.points) || 0;
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
      
    const bestQual = sortedQual.slice(0, effectiveBestCount);
      const qualTops = bestQual.filter(r => r.isTop).length;
      const qualZones = bestQual.filter(r => !r.isTop && r.zonePoints > 0).length;
      const qualPoints = bestQual.reduce((sum, r) => sum + r.points, 0);
      
      const bonusTops = bonusResults.reduce((sum, r) => sum + r.count, 0);
      const bonusPoints = bonusResults.reduce((sum, r) => sum + (r.count * (Number(r.topPoints) || 0)), 0);
      
       const finaleTops = finaleResults.filter(r => r.isTop).length;
       const finaleZones = finaleResults.filter(r => r.zonePoints > 0 && !r.isTop).length;
       const finalePoints = finaleResults.reduce((sum, r) => sum + r.points, 0);
       const finaleTotalTime = finaleResults.reduce((sum, r) => sum + parseTimeToSeconds(r.time), 0);
       
       const totalTops = qualTops + bonusTops;
       const totalPoints = config.competitionState === 'finale'
         ? finalePoints
         : qualPoints + bonusPoints + finalePoints;
       
       return {
         userId: user.id,
         username: user.username,
         role: user.role,
         qualTops,
         qualZones,
         qualPoints,
         bonusTops,
         bonusPoints,
         finaleTops,
         finaleZones,
         finalePoints,
         finaleTotalTime,
         totalPoints,
         routes: qualResults,
         bonusRoutes: bonusResults,
         finaleRoutes: finaleResults
       };
    });
    
    const sortedAthletes = [...athleteResults].sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
      if (config.competitionState === 'finale') {
        if (b.finaleTops !== a.finaleTops) return b.finaleTops - a.finaleTops;
        if (b.finaleZones !== a.finaleZones) return b.finaleZones - a.finaleZones;
        const aHasTime = a.finaleTotalTime !== Infinity;
        const bHasTime = b.finaleTotalTime !== Infinity;
        if (aHasTime && bHasTime) {
          return a.finaleTotalTime - b.finaleTotalTime;
        }
        if (aHasTime) return -1;
        if (bHasTime) return 1;
        return 0;
      }
      if (b.qualTops !== a.qualTops) return b.qualTops - a.qualTops;
      return b.bonusTops - a.bonusTops;
    });
    
    if (config.competitionState === 'finale' && sortedAthletes.length > 0) {
      console.log(`[RANKING] Group "${group.name}": sorted ${sortedAthletes.length} athletes:`, 
        sortedAthletes.map((a, i) => `${i + 1}. ${a.username} (${a.finalePoints}pts, time=${a.finaleTotalTime}s)`).join(', '));
    }
    
    const result = {
      groupId: group.id,
      groupName: group.name,
      athletes: sortedAthletes
    };
    
    if (config.competitionState === 'finale' && sortedAthletes.length > 0) {
      console.log(`[RANKING] Response athletes order:`, 
        result.athletes.map((a, i) => `${i + 1}. ${a.username}`).join(' → '));
    }
    
    return result;
  });

  return { results, config };
}

const router = Router();

router.get('/', (req, res) => {
  res.json(calculateResults());
});

export default router;
