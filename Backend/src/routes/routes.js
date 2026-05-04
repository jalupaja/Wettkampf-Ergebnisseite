import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  getRoutes,
  getRouteById,
  getCompletedRoutes,
  getUserById,
  setRouteResult,
  setBonusResult,
  getConfig
} from '../data/store.js';

const router = Router();

router.get('/', authenticate, (req, res) => {
  const config = getConfig();
  const routes = getRoutes();
  const completed = getCompletedRoutes();
  const targetUserId = String(req.query.userId || req.user.id);
  const targetUser = getUserById(targetUserId);

  if (!targetUser) {
    return res.status(404).json({ error: 'Benutzer nicht gefunden' });
  }

  const isErgebnisdienst = ['admin', 'ergebnisdienst'].includes(req.user.role);

  if (targetUserId !== req.user.id && !isErgebnisdienst) {
    return res.status(403).json({ error: 'Keine Berechtigung für andere Benutzer' });
  }

  const isAthleteOrFinalistSelf =
    targetUserId === req.user.id &&
    ['athlete', 'finalist'].includes(req.user.role);

  const isAdminOrErgebnisdienst = ['admin', 'ergebnisdienst'].includes(req.user.role);

  const visibleRoutes = isAdminOrErgebnisdienst
    ? routes
    : isErgebnisdienst
    ? routes.filter(route => route.category === 'finale')
    : isAthleteOrFinalistSelf
      ? routes.filter(route => route.category !== 'finale')
      : routes;

  const userCompleted = completed.filter(cr => cr.userId === targetUserId);
  const routesWithStatus = visibleRoutes.map(route => {
    const userResult = userCompleted.find(cr => cr.routeName === route.name);
    return {
      ...route,
      result: userResult ? userResult.result : null
    };
  });

  res.json({ routes: routesWithStatus });
});

router.post('/result', authenticate, (req, res) => {
  try {
    const { routeId, result, userId } = req.body;

    if (!routeId) {
      return res.status(400).json({ error: 'Route-ID erforderlich' });
    }

    const config = getConfig();
    const route = getRouteById(routeId);
    if (!route) {
      return res.status(404).json({ error: 'Route nicht gefunden' });
    }

    const targetUserId = String(userId || req.user.id);
    const targetUser = getUserById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ error: 'Benutzer nicht gefunden' });
    }

    const isAdminOrErgebnisdienst = ['admin', 'ergebnisdienst'].includes(req.user.role);
    const isAdmin = req.user.role === 'admin';

    if (isAdminOrErgebnisdienst && config.competitionState === 'finale') {
    } else if (config.competitionState === 'finale' && route.category === 'finale') {
      return res.status(403).json({ error: 'Nur Admin oder Ergebnisdienst dürfen Finalrouten bearbeiten' });
    }

    if (req.user.role === 'ergebnisdienst' && config.competitionState !== 'finale') {
      return res.status(403).json({ error: 'Ergebnisdienst darf nur im Finale Routen bearbeiten' });
    }

    if (targetUserId !== req.user.id && !isAdmin) {
      return res.status(403).json({ error: 'Keine Berechtigung für andere Benutzer' });
    }

    if (req.user.role === 'finalist' && config.competitionState === 'finale' && route.category === 'finale') {
      return res.status(403).json({ error: 'Finalisten dürfen Finalrouten nicht bearbeiten' });
    }

    if (!isAdminOrErgebnisdienst) {
      if (config.competitionState === 'setup' || config.competitionState === 'finished') {
        return res.status(403).json({ error: 'Wettkampf ist nicht aktiv' });
      }
      if (config.competitionState === 'finale') {
        if (req.user.role !== 'finalist' || route.category !== 'finale') {
          return res.status(403).json({ error: 'Nur Finalisten können Finalrouten bearbeiten' });
        }
      }
      if (config.competitionState === 'qualification' && route.category === 'finale') {
        return res.status(403).json({ error: 'Finalrouten können noch nicht bearbeitet werden' });
      }
    }

if (route.category === 'finale') {
      const resultInput = result === null || result === undefined ? '' : String(result).trim();

      if (resultInput === '') {
        req.body.result = null;
      } else {
        const plainSeconds = Number(resultInput.replace(',', '.'));
        if (Number.isFinite(plainSeconds) && plainSeconds > 0 && !resultInput.includes(':')) {
          const mins = Math.floor(plainSeconds / 60);
          const secs = plainSeconds % 60;
          req.body.result = secs === 0 ? `${mins}:00` : `${mins}:${secs.toFixed(1)}`;
        } else {
          const resultStr = resultInput.replace(',', ':').replace(/:+/g, ':');
          const isTimeFormat = /^\d+:\d+(\.\d+)?$/.test(resultStr);

          if (isTimeFormat) {
            req.body.result = resultStr;
          } else {
            const parsedResult = typeof result === 'number'
              ? result
              : Number(String(result).replace(',', '.'));

            if (!Number.isFinite(parsedResult) || parsedResult < 0) {
              return res.status(400).json({ error: 'Für Finalrouten Zeit eingeben (z.B. 4:32, 1:15.15 oder 75)' });
            }

            req.body.result = parsedResult;
          }
        }
      }
    } else {
      const validResults = ['top', 'attempted', null];
      if (route.zones && route.zones.length > 0) {
        route.zones.forEach(z => validResults.push(z.name));
      }

      if (result !== null && !validResults.includes(result)) {
        return res.status(400).json({ error: `Ungültiges Ergebnis: ${result}` });
      }
    }

    const finalResult = route.category === 'finale' ? req.body.result : result;
    const result_data = setRouteResult(targetUserId, route.name, finalResult);
    res.json(result_data);
  } catch (error) {
    console.error('Set route result error:', error);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

router.post('/bonus', authenticate, (req, res) => {
  try {
    const { routeId, count, userId } = req.body;

    if (!routeId) {
      return res.status(400).json({ error: 'Route-ID erforderlich' });
    }

    if (req.user.role === 'ergebnisdienst') {
      return res.status(403).json({ error: 'Ergebnisdienst darf keine Bonusdaten erfassen' });
    }

    const config = getConfig();
    const route = getRouteById(routeId);
    if (!route) {
      return res.status(404).json({ error: 'Route nicht gefunden' });
    }

    const targetUserId = String(userId || req.user.id);
    const targetUser = getUserById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ error: 'Benutzer nicht gefunden' });
    }

    if (targetUserId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Keine Berechtigung für andere Benutzer' });
    }

    if (req.user.role !== 'admin') {
      if (config.competitionState === 'setup' || config.competitionState === 'finished') {
        return res.status(403).json({ error: 'Wettkampf ist nicht aktiv' });
      }
      if (config.competitionState === 'finale') {
        return res.status(403).json({ error: 'Bonusdaten sind im Finale nicht erlaubt' });
      }
      if (route.category === 'finale') {
        return res.status(403).json({ error: 'Finalrouten können nicht als Bonusdaten erfasst werden' });
      }
    } else if (req.user.role === 'admin' && config.competitionState === 'finale') {
    }

    if (typeof count !== 'number' || count < 0) {
      return res.status(400).json({ error: 'Ungültige Anzahl' });
    }

    const result_data = setBonusResult(targetUserId, route.name, count);
    res.json(result_data);
  } catch (error) {
    console.error('Set bonus result error:', error);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

export default router;
