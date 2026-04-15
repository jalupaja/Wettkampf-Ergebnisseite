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
  
  async function toggleRoute(routeId) {
    try {
      await api.routes.toggle(routeId);
      routes = routes.map(r => 
        r.id === routeId ? { ...r, completed: !r.completed } : r
      );
    } catch (err) {
      error = err.message;
    }
  }
  
  const qualRoutes = $derived(routes.filter(r => r.category === 'qualification'));
  const bonusRoutes = $derived(routes.filter(r => r.category === 'bonus'));
  const finaleRoutes = $derived(routes.filter(r => r.category === 'finale'));
  
  const qualCompleted = $derived(qualRoutes.filter(r => r.completed).length);
  const bonusCompleted = $derived(bonusRoutes.filter(r => r.completed).length);
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
        <div class="stat-label">Qualifikation</div>
        <div class="stat-value">{qualCompleted} / {qualRoutes.length}</div>
        <div class="stat-bar">
          <div class="stat-fill" style="width: {qualRoutes.length ? (qualCompleted / qualRoutes.length) * 100 : 0}%"></div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Bonus</div>
        <div class="stat-value">{bonusCompleted} / {bonusRoutes.length}</div>
        <div class="stat-bar">
          <div class="stat-fill bonus" style="width: {bonusRoutes.length ? (bonusCompleted / bonusRoutes.length) * 100 : 0}%"></div>
        </div>
      </div>
    </div>
    
    <div class="route-sections">
      {#if qualRoutes.length}
        <section class="route-section">
          <h2>Qualifikation</h2>
          <div class="routes-grid">
            {#each qualRoutes as route}
              <button 
                class="route-card"
                class:completed={route.completed}
                onclick={() => toggleRoute(route.id)}
              >
                <div class="route-name">{route.name}</div>
                <div class="route-points">{route.points} Punkte</div>
                {#if route.completed}
                  <div class="check-mark">✓</div>
                {/if}
              </button>
            {/each}
          </div>
        </section>
      {/if}
      
      {#if bonusRoutes.length}
        <section class="route-section">
          <h2>Bonus</h2>
          <div class="routes-grid">
            {#each bonusRoutes as route}
              <button 
                class="route-card bonus-card"
                class:completed={route.completed}
                onclick={() => toggleRoute(route.id)}
              >
                <div class="route-name">{route.name}</div>
                <div class="route-points">{route.points} Punkte</div>
                {#if route.completed}
                  <div class="check-mark">✓</div>
                {/if}
              </button>
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
                class:completed={route.completed}
                onclick={() => toggleRoute(route.id)}
              >
                <div class="route-name">{route.name}</div>
                <div class="route-points">{route.points} Punkte</div>
                {#if route.completed}
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
    background: var(--color-primary);
    border-radius: 4px;
    transition: width 0.3s ease;
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
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 12px;
  }
  
  .route-card {
    position: relative;
    background: var(--color-bg-light);
    border: 2px solid var(--color-border);
    border-radius: 12px;
    padding: 20px;
    text-align: center;
    transition: all 0.2s ease;
  }
  
  .route-card:hover {
    border-color: var(--color-primary);
    transform: translateY(-2px);
  }
  
  .route-card.completed {
    background: var(--color-primary);
    border-color: var(--color-primary);
    color: white;
  }
  
  .route-card.bonus-card.completed {
    background: var(--color-secondary);
    border-color: var(--color-secondary);
  }
  
  .route-card.finale-card.completed {
    background: #9b59b6;
    border-color: #9b59b6;
  }
  
  .route-name {
    font-weight: 600;
    font-size: 16px;
    margin-bottom: 8px;
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
    color: var(--color-primary);
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
