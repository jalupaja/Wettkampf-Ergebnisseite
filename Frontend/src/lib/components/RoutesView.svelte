<script>
  import { onMount, onDestroy } from 'svelte';
  import { api } from '../api.js';
  import { userStore } from '../stores/user.js';
  import { toastStore } from '../stores/toast.js';
  import { formatPoints } from '../utils/formatters.js';
  import { CompetitionStates } from 'shared/competitionStates.js';
  import RouteCategories from 'shared/routeCategories.js';
  import Roles from 'shared/roles.js';
  
  let { targetUser = null } = $props();
  let routes = $state([]);
  let competitionState = $state(CompetitionStates.SETUP);
  let config = $state({});
  let loading = $state(true);
  let finalists = $state(new Set());
  let refreshInterval;
  
  // Timer state
  let timerRunning = $state(false);
  let timerStartTime = $state(0);
  let timerElapsed = $state(0);
  let timerInterval = $state(null);
  let showTimer = $state(false);
  let timerRouteId = $state(null);
  
  // Debounce timers for finale saves to prevent duplicate requests
  let finaleDebounceTimers = new Map();
  
  function formatTime(ms) {
    if (!ms || ms < 0) return '0:00.000';
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const millis = Math.floor(ms % 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}.${millis.toString().padStart(3, '0')}`;
  }
  
  function startTimer() {
    if (timerRunning) return;
    timerStartTime = performance.now() - timerElapsed;
    timerRunning = true;
    timerInterval = setInterval(() => {
      timerElapsed = performance.now() - timerStartTime;
    }, 10);
  }
  
  function pauseTimer() {
    if (!timerRunning) return;
    timerRunning = false;
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }
  
  function resetTimer() {
    pauseTimer();
    timerElapsed = 0;
    timerStartTime = 0;
  }
  
  function useTimerTime(routeId) {
    const timeValue = formatTime(timerElapsed);
    setFinaleTime(routeId, timeValue);
  }
  
  function openTimer(routeId) {
    timerRouteId = routeId;
    showTimer = true;
  }
  
  function closeTimer() {
    showTimer = false;
    timerRouteId = null;
  }
  
  function getActiveUser() {
    return targetUser || $userStore;
  }
  
  function getActiveUserId() {
    return getActiveUser()?.id || null;
  }
  
  onMount(async () => {
    await loadData();
    refreshInterval = setInterval(refreshState, 30000);
  });
  
  onDestroy(async () => {
    if (refreshInterval) clearInterval(refreshInterval);
    if (timerInterval) clearInterval(timerInterval);
    
    // Clear any pending finale debounce timers
    for (const timer of finaleDebounceTimers.values()) {
      clearTimeout(timer);
    }
    finaleDebounceTimers.clear();
  });
  
  function getFinalistCount(groupSize) {
    const threshold = config.finaleSmallGroupThreshold || 10;
    const maxAthletes = config.finaleMaxAthletes || 8;
    const smallGroupMax = config.finaleSmallGroupMaxAthletes || 6;
    
    if (groupSize < threshold) {
      return Math.min(smallGroupMax, groupSize);
    }
    return Math.min(maxAthletes, groupSize);
  }
  
  async function refreshState() {
    try {
      const configData = await api.config.get();
      config = configData.config;
      const newState = config.competitionState || CompetitionStates.SETUP;
      
    if (newState !== competitionState) {
      competitionState = newState;
      finalists = new Set();
    if (competitionState === CompetitionStates.FINALE) {
      const resultsData = await api.results.get();
      updateFinalists(resultsData);
        }
      } else if (competitionState === CompetitionStates.FINALE) {
        const resultsData = await api.results.get();
        updateFinalists(resultsData);
      }
    } catch (err) {
      console.error('Failed to refresh state:', err);
    }
  }
  
  function updateFinalists(resultsData) {
    const finalistSet = new Set();
    resultsData.results.forEach(group => {
      const groupSize = group.athletes.length;
      const finalistCount = getFinalistCount(groupSize);
      group.athletes.slice(0, finalistCount).forEach(athlete => {
        finalistSet.add(athlete.userId);
      });
    });
    finalists = finalistSet;
  }
  
  async function loadData() {
    loading = true;
    try {
      const [configData, resultsData] = await Promise.all([
        api.config.get(),
        competitionState === CompetitionStates.FINALE ? api.results.get() : Promise.resolve(null)
      ]);
      config = configData.config;
      competitionState = config.competitionState || CompetitionStates.SETUP;
      await loadRoutes();
      if (competitionState === CompetitionStates.FINALE && resultsData) {
        updateFinalists(resultsData);
      } else {
        finalists = new Set();
      }
    } catch (err) {
      toastStore.error(err.message);
    }
    loading = false;
  }
  
  function isFinalist() {
    const user = getActiveUser();
    if (!user) return false;
    return user.role === 'finalist';
  }
  
  function canEditRoute(route) {
    const role = $userStore?.role;
    // Use shared Roles enum
    console.debug('[canEditRoute] role=', role, 'config.state=', config?.competitionState, 'route.category=', route?.category, 'route.id=', route?.id);
    // Admin may always edit
    if (role === Roles.ADMIN) return true;

    // Schiedsrichter: only allowed to edit finale routes while the competition is in FINALE
    if (role === Roles.SCHIEDSRICHTER) {
      return config?.competitionState === CompetitionStates.FINALE && route.category === RouteCategories.FINALE;
    }

    // Athletes/Finalists: may edit during qualification and only non-finale routes (their own)
    if (role === Roles.ATHLETE || role === Roles.FINALIST) {
      if (config?.competitionState === CompetitionStates.QUALIFICATION) {
        return route.category !== RouteCategories.FINALE;
      }
      return false;
    }

    // Default deny
    return false;
  }

  function isRouteDisabled(route) {
    return !canEditRoute(route);
  }
  
  async function checkStateAndSetResult(routeId, result, resultType = 'points') {
    await refreshState();
    await setResult(routeId, result, resultType);
  }
  
  async function checkStateAndIncrementBonus(routeId, currentCount) {
    await refreshState();
    await incrementBonus(routeId, currentCount);
  }
  
  async function checkStateAndDecrementBonus(routeId, currentCount) {
    await refreshState();
    await decrementBonus(routeId, currentCount);
  }
  
  async function setResult(routeId, result, resultType = 'points') {
     const route = routes.find(r => r.id === routeId);
     if (!route) return;
     
     if (!canEditRoute(route)) {
       toastStore.error('Keine Berechtigung diese Route zu bearbeiten');
       return;
     }
     
     const userId = getActiveUserId();
     if (!userId) {
       toastStore.error('Kein Benutzer ausgewählt');
       return;
     }
     
      try {
        console.debug('[setResult] Sending', { routeId, result, userId, resultType });
        await api.routes.setResult(routeId, result, userId, resultType);
        await loadRoutes();
      } catch (err) {
        console.error('[setResult] error', err);
        toastStore.error(err.message || String(err));
      }
    }
  
  async function incrementBonus(routeId, currentCount) {
    const route = routes.find(r => r.id === routeId);
    if (!route || !canEditRoute(route)) {
      toastStore.error('Keine Berechtigung diese Route zu bearbeiten');
      return;
    }
    
    const userId = getActiveUserId();
    if (!userId) {
      toastStore.error('Kein Benutzer ausgewählt');
      return;
    }
    
    try {
      await api.routes.setBonusResult(routeId, currentCount + 1, userId);
      await loadRoutes();
    } catch (err) {
      toastStore.error(err.message);
    }
  }

  function getDisableReason(route) {
    const role = $userStore?.role;
    if (role === Roles.ADMIN) return null;
    if (role === Roles.SCHIEDSRICHTER) {
      if (config?.competitionState !== CompetitionStates.FINALE) return 'Schiedsrichter dürfen nur im Finale Routen bearbeiten';
      if (route.category !== RouteCategories.FINALE) return 'Schiedsrichter dürfen nur Finalrouten bearbeiten';
      return null;
    }
    if (role === Roles.ATHLETE || role === Roles.FINALIST) {
      if (config?.competitionState !== CompetitionStates.QUALIFICATION) return 'Athleten dürfen Routen nur während der Qualifikation bearbeiten';
      if (route.category === RouteCategories.FINALE) return 'Athleten dürfen Finalrouten nicht bearbeiten';
      return null;
    }
    return 'Keine Berechtigung';
  }
  
  async function decrementBonus(routeId, currentCount) {
    const route = routes.find(r => r.id === routeId);
    if (!route || !canEditRoute(route)) {
      toastStore.error('Keine Berechtigung diese Route zu bearbeiten');
      return;
    }
    if (currentCount <= 0) return;
    
    const userId = getActiveUserId();
    if (!userId) {
      toastStore.error('Kein Benutzer ausgewählt');
      return;
    }
    
    try {
      await api.routes.setBonusResult(routeId, currentCount - 1, userId);
      await loadRoutes();
    } catch (err) {
      toastStore.error(err.message);
    }
  }
  
  async function loadRoutes() {
    const userId = getActiveUserId();
    if (!userId) {
      routes = [];
      return;
    }
    
    try {
      const data = await api.routes.list(userId);
      routes = data.routes;
      // Backend now returns finale routes for schiedsrichter; no client-side fallback required.
    } catch (err) {
      toastStore.error(err.message);
    }
  }
   
   const qualRoutes = $derived(routes.filter(r => r.category === RouteCategories.QUALIFICATION));
   const bonusRoutes = $derived(routes.filter(r => r.category === RouteCategories.BONUS));
   const finaleRoutes = $derived(routes.filter(r => r.category === RouteCategories.FINALE));
  
   // Use the configured qualificationBestCount (fallback to 4 best routes)
   const qualBestCount = $derived(config?.qualificationBestCount || 4);
  
  const qualTops = $derived(qualRoutes.filter(r => r.result === 'top').length);
  const qualZones = $derived(qualRoutes.filter(r => r.result && r.result !== 'top' && r.result !== 'attempted').length);
  const totalBonusCount = $derived(bonusRoutes.reduce((sum, r) => sum + (typeof r.result === 'number' ? r.result : (r.result === 'top' ? 1 : 0)), 0));
  const maxBonusCount = $derived(bonusRoutes.length);
  
  function calculateQualPoints(routesToCalc, bestCount) {
    const routeResults = routesToCalc.map(r => {
      let points = 0;
      let isTop = false;
      let zonePoints = 0;
      if (r.result === 'top') {
        isTop = true;
        points = r.topPoints;
      } else if (r.result && r.result !== 'top' && r.result !== 'attempted') {
        const zone = r.zones?.find(z => z.name === r.result);
        if (zone) {
          zonePoints = zone.points;
          points = zone.points;
        }
      }
      return { ...r, points, isTop, zonePoints };
    });
    
    const sorted = [...routeResults].sort((a, b) => {
      if (a.isTop && !b.isTop) return -1;
      if (!a.isTop && b.isTop) return 1;
      if (a.zonePoints !== b.zonePoints) return b.zonePoints - a.zonePoints;
      return b.topPoints - a.topPoints;
    });
    
    const best = sorted.slice(0, bestCount);
    return best.reduce((sum, r) => sum + r.points, 0);
  }
  
  const qualPoints = $derived(calculateQualPoints(qualRoutes, qualBestCount));
  
  const bonusPoints = $derived(bonusRoutes.reduce((sum, r) => {
    const count = typeof r.result === 'number' ? r.result : (r.result === 'top' ? 1 : 0);
    return sum + (count * (Number(r.topPoints) || 0));
  }, 0));
  
  // TODO unused
  const finalePoints = $derived(finaleRoutes.reduce((sum, r) => {
    if (!r.result) return sum;
    let points = 0;
    
    try {
      if (typeof r.result === 'string' && r.result.startsWith('{')) {
        const parsed = JSON.parse(r.result);
        points = Number(parsed.points) || 0;
      } else if (r.result === 'top') {
        points = Number(r.topPoints) || 0;
      } else if (r.result && r.result !== 'top') {
        const zone = r.zones?.find(z => z.name === r.result);
        points = zone?.points || 0;
      }
    } catch (e) {
      // Fall back to old logic if JSON parsing fails
      if (r.result === 'top') {
        points = Number(r.topPoints) || 0;
      } else if (r.result && r.result !== 'top') {
        const zone = r.zones?.find(z => z.name === r.result);
        points = zone?.points || 0;
      }
    }
    
    return sum + points;
  }, 0));
  
  const totalPoints = $derived(qualPoints + bonusPoints);

  const pointsLabel = 'Deine Punkte';

  function parseFinaleInput(value) {
    if (value === '' || value === null || value === undefined) return null;
    const normalized = String(value).replace(',', '.');
    const n = Number(normalized);
    if (!Number.isFinite(n) || n < 0) return null;
    return n;
  }

  function getFinalePoints(result) {
    if (!result) return '';
    try {
      if (typeof result === 'string' && result.startsWith('{')) {
        const parsed = JSON.parse(result);
        return parsed.points !== undefined && parsed.points !== null ? parsed.points : '';
      }
    } catch (e) {
      // Fall back to checking if it's a plain number
      if (!String(result).includes(':')) return result;
    }
    return '';
  }

  function getFinaleTime(result) {
    if (!result) return '';
    try {
      if (typeof result === 'string' && result.startsWith('{')) {
        const parsed = JSON.parse(result);
        return parsed.time !== undefined && parsed.time !== null ? parsed.time : '';
      }
    } catch (e) {
      // Fall back to checking if it's a time format
      if (String(result).includes(':')) return result;
    }
    return '';
  }

  async function setFinalePoints(routeId, rawValue) {
    const parsed = parseFinaleInput(rawValue);
    
    // Don't send if user left field empty (could be unintentional)
    if (parsed === null && rawValue === '') {
      return;
    }
    
    if (parsed === null && rawValue !== '' && rawValue !== null && rawValue !== undefined) {
      toastStore.error('Bitte einen gültigen Zahlenwert >= 0 eingeben');
      return;
    }
    
    await checkStateAndSetResult(routeId, parsed);
  }
  
  async function setFinaleTime(routeId, timeValue) {
    // Skip sending empty time (intentional clear by user)
    if (timeValue === '' || timeValue === null || timeValue === undefined) {
      return;
    }
    await checkStateAndSetResult(routeId, timeValue, 'time');
  }

  function debounceFinaleChange(routeId, value, type) {
    const key = `${routeId}-${type}`;
    
    // Clear any existing timer for this field
    if (finaleDebounceTimers.has(key)) {
      clearTimeout(finaleDebounceTimers.get(key));
    }
    
    // Set new debounce timer - save after 500ms of no changes
    const timer = setTimeout(() => {
      finaleDebounceTimers.delete(key);
      if (type === 'points') {
        setFinalePoints(routeId, value);
      } else if (type === 'time') {
        setFinaleTime(routeId, value);
      }
    }, 500);
    
    finaleDebounceTimers.set(key, timer);
  }
</script>

<div class="routes-view">
  {#if competitionState === CompetitionStates.SETUP && !loading}
    <div class="setup-banner">Wettkampf noch nicht gestartet.</div>
  {:else if competitionState === CompetitionStates.FINISHED && !loading}
    <div class="setup-banner finished">Wettkampf beendet.</div>
  {/if}
  
  {#if loading}
    <div class="loading">Routen werden geladen...</div>
  {/if}

  {#if !loading}
    <div class="stats">
      {#if $userStore?.role !== Roles.SCHIEDSRICHTER}
        <div class="stat-card total">
          <div class="stat-label">{pointsLabel}</div>
          <div class="stat-value">{formatPoints(totalPoints)} Pkt</div>
        </div>
      {/if}
    </div>
    
    <div class="route-sections">
      {#if qualRoutes.length}
        <section class="route-section">
          <h2>Qualifikation</h2>
          <div class="routes-grid">
            {#each qualRoutes as route}
              {@const disabled = isRouteDisabled(route)}
              <div class="route-card" class:top={route.result === 'top'} class:zone={route.result && route.result !== 'top'} class:attempted={'result' in route && route.result === 'attempted'} class:disabled={disabled}>
                <div class="route-name">{route.name}</div>
                <div class="route-buttons">
                  <button 
                    class="result-btn attemp-btn" 
                    class:active={route.result === 'attempted'} 
                    class:disabled={disabled} 
                    disabled={disabled} 
                    onclick={() => checkStateAndSetResult(route.id, route.result === 'attempted' ? null : 'attempted')}>
                    Versucht</button>
                  {#each route.zones || [] as zone}
                    <button
                      class="result-btn zone-btn"
                      class:active={route.result === zone.name}
                      class:disabled={disabled}
                      disabled={disabled}
                      onclick={() => disabled ? toastStore.error(getDisableReason(route) || 'Keine Berechtigung') : checkStateAndSetResult(route.id, route.result === zone.name ? null : zone.name)}
                      title={disabled ? getDisableReason(route) : `Wert setzen: ${zone.name}`}
                    >{zone.name}</button>
                  {/each}
                  <button
                    class="result-btn top-btn"
                    class:active={route.result === 'top'}
                    class:disabled={disabled}
                    disabled={disabled}
                    onclick={() => disabled ? toastStore.error(getDisableReason(route) || 'Keine Berechtigung') : checkStateAndSetResult(route.id, route.result === 'top' ? null : 'top')}
                    title={disabled ? getDisableReason(route) : 'Top/keine Top'}
                  >Top</button>
                </div>
              </div>
            {/each}
          </div>
        </section>
      {/if}

      {#if bonusRoutes.length}
        <section class="route-section">
          <h2>Bonus</h2>
          <div class="routes-grid bonus-routes">
            {#each bonusRoutes as route}
              {@const disabled = isRouteDisabled(route)}
              {@const count = typeof route.result === 'number' ? route.result : (route.result === 'top' ? 1 : 0)}
              <div class="route-card bonus-card" class:disabled={disabled}>
                <div class="route-name">{route.name}</div>
                <div class="bonus-counter">
                  <button class="counter-btn minus" onclick={() => checkStateAndDecrementBonus(route.id, count)} disabled={disabled || count <= 0}>-</button>
                  <span class="counter-value">{count}</span>
                  <button class="counter-btn plus" onclick={() => checkStateAndIncrementBonus(route.id, count)} disabled={disabled}>+</button>
                  {#if disabled}
                    <span class="disabled-hint" title={getDisableReason(route)}></span>
                  {/if}
                </div>
              </div>
            {/each}
          </div>
        </section>
      {/if}
      
      {#if finaleRoutes.length}
        <section class="route-section">
          <h2>Finale</h2>
          <div class="routes-grid">
            {#each finaleRoutes as route}
              {@const disabled = isRouteDisabled(route)}
              <div class="route-card finale-card" class:disabled={disabled}>
                <div class="route-name">{route.name}</div>
                <div class="finale-input-row">
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={getFinalePoints(route.result)}
                      disabled={disabled}
                      placeholder="Punkte"
                      class="finale-points-input"
                      oninput={(e) => debounceFinaleChange(route.id, e.currentTarget.value, 'points')}
                      onkeydown={(e) => {
                        if (e.key === 'Enter') {
                          const timer = finaleDebounceTimers.get(`${route.id}-points`);
                          if (timer) clearTimeout(timer);
                          finaleDebounceTimers.delete(`${route.id}-points`);
                          setFinalePoints(route.id, e.currentTarget.value);
                        }
                      }}
                      title={disabled ? getDisableReason(route) : 'Finale Punkte'}
                    />
                     <input
                      type="text"
                      value={getFinaleTime(route.result)}
                      disabled={disabled}
                      placeholder="Zeit"
                      class="finale-time-input"
                      oninput={(e) => debounceFinaleChange(route.id, e.currentTarget.value, 'time')}
                      onkeydown={(e) => {
                        if (e.key === 'Enter') {
                          const timer = finaleDebounceTimers.get(`${route.id}-time`);
                          if (timer) clearTimeout(timer);
                          finaleDebounceTimers.delete(`${route.id}-time`);
                          setFinaleTime(route.id, e.currentTarget.value);
                        }
                      }}
                      title={disabled ? getDisableReason(route) : 'Finale Zeit'}
                    />
                  <button type="button" class="timer-btn" onclick={() => openTimer(route.id)} disabled={disabled} title="Timer">
                    ⏱️
                  </button>
                </div>
              </div>
            {/each}
          </div>
        </section>
      {/if}
      
      {#if !routes.length}
        <div class="empty-state"><p>Keine Routen verfügbar.</p></div>
      {/if}
    </div>
  {/if}
  
  {#if showTimer}
    <div class="timer-overlay" role="presentation" tabindex="-1" onclick={closeTimer} onkeydown={(e) => {
        const key = e.key || e.code;
        if (key === 'Escape' || key === 'Enter' || key === ' ' || key === 'Spacebar' || key === 'Space') closeTimer();
      }}>
      <div class="timer-popup" role="dialog" aria-modal="true" tabindex="0" onclick={(e) => e.stopPropagation()} onkeydown={(e) => e.stopPropagation()}>
        <div class="timer-header">
          <h3>Timer</h3>
          <button class="timer-close" onclick={closeTimer}>×</button>
        </div>
        <div class="timer-display">{formatTime(timerElapsed)}</div>
        <div class="timer-controls">
          {#if timerRunning}
            <button class="timer-btn-pause" onclick={pauseTimer}>Pause</button>
          {:else}
            <button class="timer-btn-start" onclick={startTimer}>{timerElapsed > 0 ? 'Weiter' : 'Start'}</button>
          {/if}
          <button class="timer-btn-reset" onclick={resetTimer}>Reset</button>
        </div>
        <div class="timer-use-row">
          {#if timerRouteId}
            <button class="timer-btn-use" onclick={() => useTimerTime(timerRouteId)}>Übernehmen</button>
          {/if}
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .routes-view { max-width: 1200px; }
  
  .setup-banner { background: color-mix(in srgb, var(--color-zone) 10%, transparent); border: 1px solid var(--color-zone); color: var(--color-zone); padding: 12px; border-radius: 8px; margin-bottom: 20px; text-align: center; font-weight: 500; }
  .setup-banner.finished { background: color-mix(in srgb, var(--color-finished) 10%, transparent); border-color: var(--color-finished); color: var(--color-finished); }
  
  .loading { text-align: center; padding: 40px; color: var(--color-text-muted); }
  
  .stats { display: grid; grid-template-columns: 1fr; gap: 16px; margin-bottom: 32px; }
  
  .stat-card { background: var(--color-bg-light); border: 1px solid var(--color-border); border-radius: 12px; padding: 20px; }
  .stat-label { font-size: 14px; color: var(--color-text-muted); margin-bottom: 8px; }
  .stat-value { font-size: 24px; font-weight: 600; margin-bottom: 12px; }

  .stat-card.total { background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary) 100%); border-color: var(--color-primary); }
  .stat-card.total .stat-value { color: var(--color-white); }
  .stat-card.total .stat-label { color: rgba(255,255,255,0.8); }
  
  .route-sections { display: flex; flex-direction: column; gap: 32px; }
  .route-section h2 { margin-bottom: 16px; font-size: 18px; color: var(--color-text); }
  
   .routes-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 12px; }
   
   .route-section:has(.finale-card) .routes-grid {
     grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
     gap: 16px;
   }

  @media (min-width: 768px) {
    .bonus-routes { 
      gap: 24px; 
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    }
  }
  
  .route-card { position: relative; background: var(--color-bg-light); border: 2px solid var(--color-border); border-radius: 12px; padding: 16px; text-align: center; transition: all 0.2s ease; }
  .route-card.zone { border-color: var(--color-zone); background: color-mix(in srgb, var(--color-zone) 10%, transparent); }
  .route-card.top { border-color: var(--color-primary); background: color-mix(in srgb, var(--color-primary) 10%, transparent); }
  .route-card.attempted { border-color: var(--color-attempted); background: color-mix(in srgb, var(--color-attempted) 10%, transparent); }
  .route-name { font-weight: 600; font-size: 15px; margin-bottom: 12px; }
  
  .route-buttons { display: grid; grid-template-columns: 1fr; gap: 6px; }
  
  .result-btn { padding: 10px 8px; border: 2px solid var(--color-border); border-radius: 6px; background: transparent; color: var(--color-text-muted); font-weight: 600; font-size: 13px; cursor: pointer; transition: all 0.2s ease; }
  .result-btn:hover { border-color: var(--color-text-muted); }
  .attemp-btn.active { background: var(--color-attempted); border-color: var(--color-attempted); color: var(--color-white); }
  .zone-btn.active { background: var(--color-zone); border-color: var(--color-zone); color: var(--color-white); }
  .top-btn.active { background: var(--color-primary); border-color: var(--color-primary); color: var(--color-white); }
  .result-btn.disabled, .result-btn:disabled { opacity: 0.4; cursor: not-allowed; pointer-events: none; }
  .route-card.disabled { opacity: 0.5; }
  
  .bonus-card { cursor: default; padding: 20px; display: flex; flex-direction: column; justify-content: space-between; min-height: 120px; min-width: 180px; }
  .bonus-card .route-name { margin-bottom: 16px; }
  .bonus-counter { display: flex; align-items: center; justify-content: center; gap: 16px; flex: 1; width: 100%; }
  .counter-btn { width: 40px; height: 40px; border: 2px solid var(--color-border); border-radius: 50%; background: transparent; color: var(--color-text); font-size: 20px; font-weight: 600; cursor: pointer; transition: all 0.2s ease; display: flex; align-items: center; justify-content: center; }
  .counter-btn:hover:not(:disabled) { border-color: var(--color-secondary); color: var(--color-secondary); }
  .counter-btn:disabled { opacity: 0.3; cursor: not-allowed; }
  .counter-value { font-size: 28px; font-weight: 700; color: var(--color-secondary); min-width: 40px; }
  
   .route-card.finale-card { cursor: pointer; }
   .route-card.finale-card:hover { border-color: var(--color-finale); transform: translateY(-2px); }
   .route-card.finale-card.disabled { opacity: 0.4; cursor: not-allowed; pointer-events: none; }
   .route-card.finale-card {
     padding: 24px;
     min-height: 220px;
     display: flex;
     flex-direction: column;
     justify-content: center;
     align-items: center;
   }
   
   .route-card.finale-card .route-name {
     font-size: 20px;
     margin-bottom: 20px;
     font-weight: 700;
   }

   .finale-input-row {
     display: flex;
     justify-content: center;
     gap: 12px;
     flex-wrap: wrap;
     width: 100%;
   }

    .finale-input-row input {
      max-width: 140px;
      text-align: center;
      font-weight: 600;
      padding: 14px 12px;
      font-size: 18px;
      border: 2px solid var(--color-border);
      border-radius: 8px;
      /* Match the site's standard input background so color contrast is correct
         in both light and dark themes */
      background: var(--color-bg-light);
      color: var(--color-text);
    }
   
    .finale-points-input {
      width: 130px;
      color: var(--color-text);
    }
    .finale-time-input {
      width: 160px;
      color: var(--color-text);
    }

    /* Placeholder color should be muted but visible */
    .finale-input-row input::placeholder {
      color: var(--color-text-muted);
      opacity: 1;
    }
  
   .timer-btn {
     background: var(--color-bg-light);
     border: 2px solid var(--color-finale);
     border-radius: 8px;
     padding: 12px 16px;
     font-size: 20px;
     cursor: pointer;
   }
   .timer-btn:hover:not(:disabled) { background: var(--color-finale); }
   .timer-btn:disabled { opacity: 0.4; cursor: not-allowed; }
  
  .timer-overlay {
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
  }
  
  .timer-popup {
    background: var(--color-bg);
    border-radius: 16px;
    padding: 24px;
    min-width: 320px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  }
  
  .timer-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }
  
  .timer-header h3 { margin: 0; font-size: 20px; }
  
  .timer-close {
    background: none;
    border: none;
    font-size: 28px;
    cursor: pointer;
    color: var(--color-text-muted);
  }
  
  .timer-display {
    font-size: 48px;
    font-weight: 700;
    text-align: center;
    font-family: monospace;
    margin-bottom: 4px;
    color: var(--color-finale);
  }
  
  .timer-controls {
    display: flex;
    gap: 8px;
    justify-content: center;
    flex-wrap: wrap;
    margin-bottom: 12px;
  }
  
  .timer-controls button {
    padding: 8px 14px;
    border-radius: 6px;
    font-weight: 600;
    cursor: pointer;
    font-size: 12px;
  }
  
  .timer-use-row {
    display: flex;
    justify-content: center;
  }
  
  .timer-btn-use {
    padding: 10px 20px;
    border-radius: 6px;
    font-weight: 600;
    font-size: 14px;
    background: var(--color-finale);
    border: 2px solid var(--color-finale);
    color: white;
    cursor: pointer;
  }
  .timer-btn-use:hover {
    background: color-mix(in srgb, var(--color-finale) 80%, black);
  }
  
  .timer-btn-start {
    background: var(--color-primary);
    border: 2px solid var(--color-primary);
    color: white;
  }
  .timer-btn-start:hover { background: color-mix(in srgb, var(--color-primary) 80%, black); }
  
  .timer-btn-pause {
    background: var(--color-zone);
    border: 2px solid var(--color-zone);
    color: white;
  }
  .timer-btn-pause:hover { background: color-mix(in srgb, var(--color-zone) 80%, black); }
  
  .timer-btn-reset {
    background: transparent;
    border: 2px solid var(--color-error);
    color: var(--color-error);
  }
  .timer-btn-reset:hover { background: var(--color-error); color: white; }
  
  .timer-btn-use {
    background: var(--color-finale);
    border: 2px solid var(--color-finale);
    color: white;
  }
  .timer-btn-use:hover { background: color-mix(in srgb, var(--color-finale) 80%, black); }
  
  .empty-state { text-align: center; padding: 60px; color: var(--color-text-muted); }
  
   @media (max-width: 480px) {
     .stats { grid-template-columns: 1fr; gap: 12px; }
     .routes-grid { grid-template-columns: 1fr; gap: 8px; }
     .route-card { padding: 12px; }
     .route-name { font-size: 13px; margin-bottom: 8px; }
     .result-btn { padding: 8px 6px; font-size: 11px; }
     .route-buttons { grid-template-columns: 1fr; gap: 4px; }
     
     .route-section:has(.finale-card) .routes-grid {
       grid-template-columns: 1fr;
     }
     
     .route-card.finale-card {
       padding: 20px;
       min-height: 200px;
     }
     
     .route-card.finale-card .route-name {
       font-size: 18px;
       margin-bottom: 16px;
     }
     
     .finale-input-row {
       gap: 8px;
     }
     
     .finale-input-row input {
       font-size: 16px;
       padding: 12px 10px;
     }
     
     .finale-points-input {
       width: 110px;
     }
     
     .finale-time-input {
       width: 140px;
     }
     
     .timer-btn {
       padding: 12px 14px;
       font-size: 18px;
     }
   }
</style>
