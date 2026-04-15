<script>
  import { onMount } from 'svelte';
  import { api } from '../api.js';
  
  let routes = $state([]);
  let loading = $state(true);
  let error = $state('');
  
  onMount(async () => {
    await loadRoutes();
  });
  
  async function loadRoutes() {
    loading = true;
    error = '';
    try {
      const data = await api.routes.list();
      routes = data.routes;
    } catch (err) {
      error = err.message;
    }
    loading = false;
  }
  
  async function setResult(routeId, result) {
    try {
      await api.routes.setResult(routeId, result);
      routes = routes.map(r => 
        r.id === routeId ? { ...r, result } : r
      );
    } catch (err) {
      error = err.message;
    }
  }
  
  async function incrementBonus(routeId, currentCount) {
    try {
      await api.routes.setBonusResult(routeId, currentCount + 1);
      await loadRoutes();
    } catch (err) {
      error = err.message;
    }
  }
  
  async function decrementBonus(routeId, currentCount) {
    if (currentCount <= 0) return;
    try {
      await api.routes.setBonusResult(routeId, currentCount - 1);
      await loadRoutes();
    } catch (err) {
      error = err.message;
    }
  }
  
  const qualRoutes = $derived(routes.filter(r => r.category === 'qualification'));
  const bonusRoutes = $derived(routes.filter(r => r.category === 'bonus'));
  const finaleRoutes = $derived(routes.filter(r => r.category === 'finale'));
  
  const qualTops = $derived(qualRoutes.filter(r => r.result === 'top').length);
  const qualZones = $derived(qualRoutes.filter(r => r.result === 'zone').length);
  const totalBonusCount = $derived(bonusRoutes.reduce((sum, r) => sum + (r.result || 0), 0));
  const maxBonusCount = $derived(bonusRoutes.reduce((sum, r) => sum + 1, 0));
</script>

<div class="routes-view">
  {#if error}
    <div class="error-message">{error}</div>
  {/if}
  
  {#if loading}
    <div class="loading">Routen werden geladen...</div>
  {:else}
    <div class="stats">
      <div class="stat-card">
        <div class="stat-label">Qualifikation Tops</div>
        <div class="stat-value">{qualTops} / {qualRoutes.length}</div>
        <div class="stat-bar">
          <div class="stat-fill top" style="width: {qualRoutes.length ? (qualTops / qualRoutes.length) * 100 : 0}%"></div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Qualifikation Zonen</div>
        <div class="stat-value">{qualZones} / {qualRoutes.length}</div>
        <div class="stat-bar">
          <div class="stat-fill zone" style="width: {qualRoutes.length ? (qualZones / qualRoutes.length) * 100 : 0}%"></div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Bonus Tops</div>
        <div class="stat-value">{totalBonusCount} / {maxBonusCount}</div>
        <div class="stat-bar">
          <div class="stat-fill bonus" style="width: {maxBonusCount ? (totalBonusCount / maxBonusCount) * 100 : 0}%"></div>
        </div>
      </div>
    </div>
    
    <div class="route-sections">
      {#if qualRoutes.length}
        <section class="route-section">
          <h2>Qualifikation</h2>
          <div class="routes-grid">
            {#each qualRoutes as route}
              <div class="route-card" class:top={route.result === 'top'} class:zone={route.result === 'zone'}>
                <div class="route-name">{route.name}</div>
                <div class="route-buttons">
                  <button 
                    class="result-btn zone-btn" 
                    class:active={route.result === 'zone'}
                    onclick={() => setResult(route.id, route.result === 'zone' ? null : 'zone')}
                  >
                    Zone
                  </button>
                  <button 
                    class="result-btn top-btn" 
                    class:active={route.result === 'top'}
                    onclick={() => setResult(route.id, route.result === 'top' ? null : 'top')}
                  >
                    Top
                  </button>
                </div>
              </div>
            {/each}
          </div>
        </section>
      {/if}
      
      {#if bonusRoutes.length}
        <section class="route-section">
          <h2>Bonus</h2>
          <div class="routes-grid">
            {#each bonusRoutes as route}
              <div class="route-card bonus-card">
                <div class="route-name">{route.name}</div>
                <div class="bonus-counter">
                  <button 
                    class="counter-btn minus" 
                    onclick={() => decrementBonus(route.id, route.result || 0)}
                    disabled={(route.result || 0) <= 0}
                  >
                    -
                  </button>
                  <span class="counter-value">{route.result || 0}</span>
                  <button 
                    class="counter-btn plus"
                    onclick={() => incrementBonus(route.id, route.result || 0)}
                  >
                    +
                  </button>
                </div>
                <div class="route-points">Top {route.result || 0}/{1}</div>
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
              <button 
                class="route-card finale-card"
                class:completed={route.result === 'top'}
                onclick={() => setResult(route.id, route.result === 'top' ? null : 'top')}
              >
                <div class="route-name">{route.name}</div>
                <div class="route-points">Top</div>
                {#if route.result === 'top'}
                  <div class="check-mark">✓</div>
                {/if}
              </button>
            {/each}
          </div>
        </section>
      {/if}
      
      {#if !routes.length}
        <div class="empty-state">
          <p>Keine Routen verfügbar.</p>
          <p>Der Admin muss zuerst Routen erstellen.</p>
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .routes-view {
    max-width: 1200px;
  }
  
  .error-message {
    background: rgba(231, 76, 60, 0.1);
    border: 1px solid var(--color-error);
    color: var(--color-error);
    padding: 12px;
    border-radius: 8px;
    margin-bottom: 20px;
  }
  
  .loading {
    text-align: center;
    padding: 40px;
    color: var(--color-text-muted);
  }
  
  .stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
    margin-bottom: 32px;
  }
  
  .stat-card {
    background: var(--color-bg-light);
    border: 1px solid var(--color-border);
    border-radius: 12px;
    padding: 20px;
  }
  
  .stat-label {
    font-size: 14px;
    color: var(--color-text-muted);
    margin-bottom: 8px;
  }
  
  .stat-value {
    font-size: 24px;
    font-weight: 600;
    margin-bottom: 12px;
  }
  
  .stat-bar {
    height: 8px;
    background: var(--color-border);
    border-radius: 4px;
    overflow: hidden;
  }
  
  .stat-fill {
    height: 100%;
    border-radius: 4px;
    transition: width 0.3s ease;
  }
  
  .stat-fill.top {
    background: var(--color-primary);
  }
  
  .stat-fill.zone {
    background: #f39c12;
  }
  
  .stat-fill.bonus {
    background: var(--color-secondary);
  }
  
  .route-sections {
    display: flex;
    flex-direction: column;
    gap: 32px;
  }
  
  .route-section h2 {
    margin-bottom: 16px;
    font-size: 18px;
    color: var(--color-text);
  }
  
  .routes-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 12px;
  }
  
  .route-card {
    position: relative;
    background: var(--color-bg-light);
    border: 2px solid var(--color-border);
    border-radius: 12px;
    padding: 16px;
    text-align: center;
    transition: all 0.2s ease;
  }
  
  .route-card.zone {
    border-color: #f39c12;
    background: rgba(243, 156, 18, 0.1);
  }
  
  .route-card.top {
    border-color: var(--color-primary);
    background: rgba(255, 107, 0, 0.1);
  }
  
  .route-name {
    font-weight: 600;
    font-size: 16px;
    margin-bottom: 12px;
  }
  
  .route-buttons {
    display: flex;
    gap: 8px;
  }
  
  .result-btn {
    flex: 1;
    padding: 8px;
    border: 2px solid var(--color-border);
    border-radius: 8px;
    background: transparent;
    color: var(--color-text-muted);
    font-weight: 600;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .result-btn:hover {
    border-color: var(--color-text-muted);
  }
  
  .zone-btn.active {
    background: #f39c12;
    border-color: #f39c12;
    color: white;
  }
  
  .top-btn.active {
    background: var(--color-primary);
    border-color: var(--color-primary);
    color: white;
  }
  
  .bonus-card {
    cursor: default;
  }
  
  .bonus-counter {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
    margin-bottom: 8px;
  }
  
  .counter-btn {
    width: 36px;
    height: 36px;
    border: 2px solid var(--color-border);
    border-radius: 50%;
    background: transparent;
    color: var(--color-text);
    font-size: 20px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .counter-btn:hover:not(:disabled) {
    border-color: var(--color-secondary);
    color: var(--color-secondary);
  }
  
  .counter-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
  
  .counter-value {
    font-size: 28px;
    font-weight: 700;
    color: var(--color-secondary);
    min-width: 40px;
  }
  
  .route-card.finale-card {
    cursor: pointer;
  }
  
  .route-card.finale-card:hover {
    border-color: #9b59b6;
    transform: translateY(-2px);
  }
  
  .route-card.finale-card.completed {
    background: #9b59b6;
    border-color: #9b59b6;
    color: white;
  }
  
  .route-points {
    font-size: 14px;
    opacity: 0.8;
  }
  
  .check-mark {
    position: absolute;
    top: 8px;
    right: 8px;
    width: 24px;
    height: 24px;
    background: white;
    color: #9b59b6;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    font-weight: bold;
  }
  
  .empty-state {
    text-align: center;
    padding: 60px;
    color: var(--color-text-muted);
  }
  
  .empty-state p {
    margin-bottom: 8px;
  }
</style>
