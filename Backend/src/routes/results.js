import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  getRoutes,
  getUsers,
  getGroups,
  getCompletedRoutes,
  getConfig
} from '../data/store.js';

const router = Router();

router.get('/', authenticate, (req, res) => {
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
      const completedRouteIds = userCompleted.map(cr => cr.routeId);
      
      const qualCompleted = qualificationRoutes.filter(r => completedRouteIds.includes(r.id));
      const bonusCompleted = bonusRoutes.filter(r => completedRouteIds.includes(r.id));
      
      const sortedQual = [...qualCompleted].sort((a, b) => b.points - a.points);
      const bestQual = sortedQual.slice(0, bestCount);
      const qualPoints = bestQual.reduce((sum, r) => sum + r.points, 0);
      const bonusPoints = bonusCompleted.reduce((sum, r) => sum + r.points, 0);
      const totalPoints = qualPoints + bonusPoints;
      
      return {
        userId: user.id,
        username: user.username,
        qualCompleted: qualCompleted.length,
        bonusCompleted: bonusCompleted.length,
        qualPoints,
        bonusPoints,
        totalPoints,
        routes: qualificationRoutes.map(r => ({
          routeId: r.id,
          name: r.name,
          points: r.points,
          completed: completedRouteIds.includes(r.id)
        }))
      };
    });
    
    const sortedAthletes = [...athleteResults].sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
      if (b.qualCompleted !== a.qualCompleted) return b.qualCompleted - a.qualCompleted;
      return b.bonusCompleted - a.bonusCompleted;
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
