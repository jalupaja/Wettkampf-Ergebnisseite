<script>
  import { onMount, onDestroy } from 'svelte';
  import { api } from '../api.js';
  import { userStore } from '../stores/user.js';
  
  let routes = $state([]);
  let competitionState = $state('setup');
  let config = $state({});
  let loading = $state(true);
  let error = $state('');
  let finalists = $state(new Set());
  let refreshInterval;
  
  onMount(async () => {
    await loadData();
    refreshInterval = setInterval(refreshState, 30000);
  });
  
  onDestroy(() => {
    if (refreshInterval) clearInterval(refreshInterval);
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
      const newState = config.competitionState || 'setup';
      
      if (newState !== competitionState) {
        competitionState = newState;
        if (competitionState === 'finale') {
          const resultsData = await api.results.get();
          updateFinalists(resultsData);
        }
      } else if (competitionState === 'finale') {
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
    error = '';
    try {
      const promises = [api.routes.list(), api.config.get()];
      
      if (competitionState === 'finale') {
        promises.push(api.results.get());
      }
      
      const results = await Promise.all(promises);
      routes = results[0].routes;
      config = results[1].config;
      competitionState = config.competitionState || 'setup';
      
      if (competitionState === 'finale' && results[2]) {
        updateFinalists(results[2]);
      }
    } catch (err) {
      error = err.message;
    }
    loading = false;
  }
  
  function isFinalist() {
    const user = $userStore;
    if (!user) return false;
    return finalists.has(user.id);
  }
  
  function canEditRoute(route) {
    if (competitionState === 'setup') return false;
    if (competitionState === 'qualification') return true;
    if (competitionState === 'finale') {
      return route.category === 'finale' && isFinalist();
    }
    if (competitionState === 'finished') return false;
    return false;
  }
  
  function isRouteDisabled(route) {
    if (competitionState === 'setup') return true;
    if (competitionState === 'qualification') return false;
    if (competitionState === 'finale') {
      return route.category !== 'finale' || !isFinalist();
    }
    if (competitionState === 'finished') return true;
    return true;
  }
  
  async function checkStateAndSetResult(routeId, result) {
    await refreshState();
    await setResult(routeId, result);
  }
  
  async function checkStateAndIncrementBonus(routeId, currentCount) {
    await refreshState();
    await incrementBonus(routeId, currentCount);
  }
  
  async function checkStateAndDecrementBonus(routeId, currentCount) {
    await refreshState();
    await decrementBonus(routeId, currentCount);
  }
  
  async function setResult(routeId, result) {
    const route = routes.find(r => r.id === routeId);
    if (!route) return;
    
    if (!canEditRoute(route)) {
      error = 'Keine Berechtigung diese Route zu bearbeiten';
      return;
    }
    try {
      await api.routes.setResult(routeId, result);
      routes = routes.map(r => r.id === routeId ? { ...r, result } : r);
    } catch (err) {
      error = err.message;
    }
  }
  
  async function incrementBonus(routeId, currentCount) {
    const route = routes.find(r => r.id === routeId);
    if (!route || !canEditRoute(route)) {
      error = 'Keine Berechtigung diese Route zu bearbeiten';
      return;
    }
    try {
      await api.routes.setBonusResult(routeId, currentCount + 1);
      await loadRoutes();
    } catch (err) {
      error = err.message;
    }
  }
  
  async function decrementBonus(routeId, currentCount) {
    const route = routes.find(r => r.id === routeId);
    if (!route || !canEditRoute(route)) {
      error = 'Keine Berechtigung diese Route zu bearbeiten';
      return;
    }
    if (currentCount <= 0) return;
    try {
      await api.routes.setBonusResult(routeId, currentCount - 1);
      await loadRoutes();
    } catch (err) {
      error = err.message;
    }
  }
  
  async function loadRoutes() {
    try {
      const data = await api.routes.list();
      routes = data.routes;
    } catch (err) {
      error = err.message;
    }
  }
  
  const qualRoutes = $derived(routes.filter(r => r.category === 'qualification'));
  const bonusRoutes = $derived(routes.filter(r => r.category === 'bonus'));
  const finaleRoutes = $derived(routes.filter(r => r.category === 'finale'));
  
  const qualTops = $derived(qualRoutes.filter(r => r.result === 'top').length);
  const qualZones = $derived(qualRoutes.filter(r => r.result && r.result !== 'top').length);
  const totalBonusCount = $derived(bonusRoutes.reduce((sum, r) => sum + (typeof r.result === 'number' ? r.result : (r.result === 'top' ? 1 : 0)), 0));
  const maxBonusCount = $derived(bonusRoutes.length);
  
  // Calculate current points
  const qualPoints = $derived(qualRoutes.reduce((sum, r) => {
    if (r.result === 'top') return sum + r.topPoints;
    if (r.result === 'attempted') return sum;
    if (r.result && r.result !== 'top') {
      const zone = r.zones?.find(z => z.name === r.result);
      return sum + (zone?.points || 0);
    }
    return sum;
  }, 0));
  
  const bonusPoints = $derived(totalBonusCount * 50);
  const totalPoints = $derived(qualPoints + bonusPoints);
</script>

<div class="routes-view">
  {#if competitionState === 'setup' && !loading}
    <div class="setup-banner">Wettkampf noch nicht gestartet.</div>
  {:else if competitionState === 'finale' && !isFinalist() && !loading}
    <div class="setup-banner finale">Finale läuft. Nur Finalisten können ihre Ergebnisse bearbeiten.</div>
  {:else if competitionState === 'finished' && !loading}
    <div class="setup-banner finished">Wettkampf beendet.</div>
  {/if}
  
  {#if error}
    <div class="error-message">{error}</div>
  {/if}
  
  {#if loading}
    <div class="loading">Routen werden geladen...</div>
  {:else}
    <div class="stats">
      <div class="stat-card total">
        <div class="stat-label">Deine Punkte</div>
        <div class="stat-value">{totalPoints} Pkt</div>
      </div>
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
                  <button class="result-btn zone-btn" class:disabled={disabled} disabled={disabled} onclick={() => checkStateAndSetResult(route.id, route.result === 'attempted' ? null : 'attempted')}>Versucht</button>
                  {#each route.zones || [] as zone}
                    <button class="result-btn zone-btn" class:active={route.result === zone.name} class:disabled={disabled} disabled={disabled} onclick={() => checkStateAndSetResult(route.id, route.result === zone.name ? null : zone.name)}>{zone.name}</button>
                  {/each}
                  <button class="result-btn top-btn" class:active={route.result === 'top'} class:disabled={disabled} disabled={disabled} onclick={() => checkStateAndSetResult(route.id, route.result === 'top' ? null : 'top')}>Top</button>
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
                </div>
              </div>
            {/each}
          </div>
        </section>
      {/if}
      
      {#if finaleRoutes.length && competitionState === 'finale' && isFinalist()}
        <section class="route-section">
          <h2>Finale</h2>
          <div class="routes-grid">
            {#each finaleRoutes as route}
              {@const disabled = isRouteDisabled(route)}
              {@const hasZones = route.zones && route.zones.length > 0}
              {#if hasZones}
                <div class="route-card finale-card" class:disabled={disabled}>
                  <div class="route-name">{route.name}</div>
                  <div class="route-buttons">
                    <button class="result-btn zone-btn" class:active={route.result === 'attempted'} class:disabled={disabled} disabled={disabled} onclick={() => checkStateAndSetResult(route.id, route.result === 'attempted' ? null : 'attempted')}>Versucht</button>
                    {#each route.zones as zone}
                      <button class="result-btn zone-btn" class:active={route.result === zone.name} class:disabled={disabled} disabled={disabled} onclick={() => checkStateAndSetResult(route.id, route.result === zone.name ? null : zone.name)}>{zone.name}</button>
                    {/each}
                    <button class="result-btn top-btn" class:active={route.result === 'top'} class:disabled={disabled} disabled={disabled} onclick={() => checkStateAndSetResult(route.id, route.result === 'top' ? null : 'top')}>Top</button>
                  </div>
                </div>
              {:else}
                <button class="route-card finale-card" class:disabled={disabled} class:completed={route.result === 'top'} disabled={disabled} onclick={() => checkStateAndSetResult(route.id, route.result === 'top' ? null : 'top')}>
                  <div class="route-name">{route.name}</div>
                  <div class="route-points">Top</div>
                  {#if route.result === 'top'}
                    <div class="check-mark">✓</div>
                  {/if}
                </button>
              {/if}
            {/each}
          </div>
        </section>
      {/if}
      
      {#if !routes.length}
        <div class="empty-state"><p>Keine Routen verfügbar.</p></div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .routes-view { max-width: 1200px; }
  
  .error-message { background: rgba(231, 76, 60, 0.1); border: 1px solid var(--color-error); color: var(--color-error); padding: 12px; border-radius: 8px; margin-bottom: 20px; }
  
  .setup-banner { background: color-mix(in srgb, var(--color-zone) 10%, transparent); border: 1px solid var(--color-zone); color: var(--color-zone); padding: 12px; border-radius: 8px; margin-bottom: 20px; text-align: center; font-weight: 500; }
  .setup-banner.finale { background: color-mix(in srgb, var(--color-finale) 10%, transparent); border-color: var(--color-finale); color: var(--color-finale); }
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
  .route-card.finale-card.completed { background: var(--color-finale); border-color: var(--color-finale); color: var(--color-white); }
  .route-card.finale-card.disabled { opacity: 0.4; cursor: not-allowed; pointer-events: none; }
  .route-points { font-size: 14px; opacity: 0.8; }
  .check-mark { position: absolute; top: 8px; right: 8px; width: 24px; height: 24px; background: var(--color-white); color: var(--color-finale); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: bold; }
  
  .empty-state { text-align: center; padding: 60px; color: var(--color-text-muted); }
  
  @media (max-width: 480px) {
    .stats { grid-template-columns: 1fr; gap: 12px; }
    .routes-grid { grid-template-columns: 1fr; gap: 8px; }
    .route-card { padding: 12px; }
    .route-name { font-size: 13px; margin-bottom: 8px; }
    .result-btn { padding: 8px 6px; font-size: 11px; }
    .route-buttons { grid-template-columns: 1fr; gap: 4px; }
  }
</style>
