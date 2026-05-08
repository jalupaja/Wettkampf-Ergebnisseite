import { Router } from 'express';
import CompetitionStates from '../../../shared/competitionStates.js';
import RouteCategories from '../../../shared/routeCategories.js';
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

    const isSchiedsrichter = req.user.role === 'schiedsrichter';
    const isAdmin = req.user.role === 'admin';

  if (targetUserId !== req.user.id && !isSchiedsrichter && !isAdmin) {
    return res.status(403).json({ error: 'Keine Berechtigung für andere Benutzer' });
  }

  const isAthleteOrFinalistSelf =
    targetUserId === req.user.id &&
    ['athlete', 'finalist'].includes(req.user.role);

    // Visible routes:
    // - Admin: all routes
    // - Schiedsrichter: only finale routes
    // - Athlete/Finalist (self): qualification and bonus (not finale)
    const visibleRoutes = isAdmin
      ? routes
      : isSchiedsrichter
      ? routes.filter(route => route.category === RouteCategories.FINALE)
      : isAthleteOrFinalistSelf
        ? routes.filter(route => route.category !== RouteCategories.FINALE)
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
    const { routeId, result, userId, resultType = 'points' } = req.body;

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

    const isAdmin = req.user.role === 'admin';
    const isSchiedsrichter = req.user.role === 'schiedsrichter';
    const isSelf = targetUserId === req.user.id;
    const isAthleteOrFinalist = ['athlete', 'finalist'].includes(req.user.role);

    if (isAdmin) {
      // Admin allowed
    } else if (isSchiedsrichter) {
      if (config.competitionState !== CompetitionStates.FINALE) {
        return res.status(403).json({ error: 'Schiedsrichter darf nur im Finale Routen bearbeiten' });
      }
      if (route.category !== 'finale') {
        return res.status(403).json({ error: 'Schiedsrichter darf nur Finalrouten bearbeiten' });
      }
    } else if (isSelf && isAthleteOrFinalist) {
      if (config.competitionState !== CompetitionStates.QUALIFICATION) {
        return res.status(403).json({ error: 'Benutzer dürfen Routen nur während der Qualifikation bearbeiten' });
      }
      if (route.category === 'finale') {
        return res.status(403).json({ error: 'Benutzer dürfen Finalrouten nicht bearbeiten' });
      }
    } else {
      return res.status(403).json({ error: 'Keine Berechtigung für andere Benutzer' });
    }

  if (route.category === 'finale') {
      const resultInput = result === null || result === undefined ? '' : String(result).trim();
      
      // Get existing finale result to merge
      const userCompleted = getCompletedRoutes();
      const existing = userCompleted.find(cr => cr.userId === targetUserId && cr.routeName === route.name);
      let existingFinaleData = {};
      
      try {
        if (existing && typeof existing.result === 'string' && existing.result.startsWith('{')) {
          existingFinaleData = JSON.parse(existing.result);
        } else if (existing && typeof existing.result === 'string') {
          // Handle legacy format: plain numeric value (shouldn't happen, but preserve it)
          const legacyNum = Number(String(existing.result).replace(',', '.'));
          if (Number.isFinite(legacyNum)) {
            existingFinaleData.points = legacyNum;
          }
        }
      } catch (e) {
        // If parsing fails, try to recover the numeric value
        console.warn(`[FINALE] Failed to parse existing result for ${route.name}:`, existing?.result, e.message);
        if (existing && typeof existing.result === 'string') {
          const legacyNum = Number(String(existing.result).replace(',', '.'));
          if (Number.isFinite(legacyNum)) {
            existingFinaleData.points = legacyNum;
          }
        }
      }

      // Only update if there's an actual input value (not empty string)
      if (resultInput !== '') {
        if (resultType === 'time') {
          // Handle time format (M:SS or plain seconds)
          const plainSeconds = Number(resultInput.replace(',', '.'));
          if (Number.isFinite(plainSeconds) && plainSeconds > 0 && !resultInput.includes(':')) {
            const mins = Math.floor(plainSeconds / 60);
            const secs = plainSeconds % 60;
            existingFinaleData.time = secs === 0 ? `${mins}:00` : `${mins}:${secs.toFixed(1)}`;
          } else {
            const resultStr = resultInput.replace(',', ':').replace(/:+/g, ':');
            const isTimeFormat = /^\d+:\d+(\.\d+)?$/.test(resultStr);

            if (isTimeFormat) {
              existingFinaleData.time = resultStr;
            } else {
              return res.status(400).json({ error: 'Für Finalrouten Zeit eingeben (z.B. 4:32, 1:15.15 oder 75)' });
            }
          }
        } else {
          // Handle points format (numeric)
          const parsedResult = typeof result === 'number'
            ? result
            : Number(String(result).replace(',', '.'));

          if (!Number.isFinite(parsedResult) || parsedResult < 0) {
            return res.status(400).json({ error: 'Für Finalrouten Punkte eingeben (z.B. 100, 87.5)' });
          }

          existingFinaleData.points = parsedResult;
        }
      } else {
        // Empty input - only clear the specific field if it's explicitly being cleared
        if (resultType === 'points') {
          existingFinaleData.points = null;
        } else if (resultType === 'time') {
          existingFinaleData.time = null;
        }
      }
      
      // If both are empty/null, set result to null; otherwise store as JSON
      if ((!existingFinaleData.points && existingFinaleData.points !== 0) && !existingFinaleData.time) {
        req.body.result = null;
      } else {
        req.body.result = JSON.stringify(existingFinaleData);
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

    if (req.user.role === 'schiedsrichter') {
      return res.status(403).json({ error: 'Schiedsrichter darf keine Bonusdaten erfassen' });
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
      if (config.competitionState === CompetitionStates.SETUP || config.competitionState === CompetitionStates.FINISHED) {
        return res.status(403).json({ error: 'Wettkampf ist nicht aktiv' });
      }
      if (config.competitionState === CompetitionStates.FINALE) {
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
