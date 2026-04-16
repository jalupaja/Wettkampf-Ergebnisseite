<script>
  import { onMount, onDestroy } from 'svelte';
  import { api } from '../api.js';
  
  let { admin = false } = $props();
  
  let results = $state([]);
  let config = $state(null);
  let loading = $state(true);
  let error = $state('');
  let refreshInterval;
  
  onMount(async () => {
    await loadResults();
    refreshInterval = setInterval(loadResults, 10000);
  });
  
  onDestroy(() => {
    if (refreshInterval) clearInterval(refreshInterval);
  });
  
  async function loadResults() {
    try {
      const data = await api.results.get();
      results = data.results;
      config = data.config;
    } catch (err) {
      error = err.message;
    }
    loading = false;
  }
</script>

<div class="results-view">
  {#if error}
    <div class="error-message">{error}</div>
  {/if}
  
  {#if loading}
    <div class="loading">Rangliste wird geladen...</div>
  {:else}
    <div class="results-header">
      <h2>Rangliste</h2>
      {#if config}
        <span class="config-info">
          Top {config.qualificationBestCount} Routen gewertet
        </span>
      {/if}
    </div>
    
    {#if results.length}
      {#each results as groupResult}
        <div class="group-results card">
          <h3 class="group-title">{groupResult.groupName}</h3>
          
          {#if groupResult.athletes.length}
            <table class="results-table">
              <thead>
                <tr>
                  <th class="rank-col">Platz</th>
                  <th class="name-col">Name</th>
                  <th class="stat-col">Tops</th>
                  <th class="stat-col">Zonen</th>
                  <th class="stat-col">Bonus</th>
                  <th class="stat-col">Finale</th>
                  <th class="points-col">Punkte</th>
                </tr>
              </thead>
              <tbody>
                {#each groupResult.athletes as athlete, index}
                  <tr class:gold={index === 0} class:silver={index === 1} class:bronze={index === 2}>
                    <td class="rank-col">
                      {#if index === 0}🥇
                      {:else if index === 1}🥈
                      {:else if index === 2}🥉
                      {:else}{index + 1}{/if}
                    </td>
                    <td class="name-col">{athlete.username}</td>
                    <td class="stat-col">
                      <span class="stat-value top">{athlete.qualTops}</span>
                    </td>
                    <td class="stat-col">
                      <span class="stat-value zone">{athlete.qualZones}</span>
                    </td>
                    <td class="stat-col">
                      <span class="stat-value bonus">{athlete.bonusTops}</span>
                    </td>
                    <td class="stat-col">
                      <span class="stat-value finale">{athlete.finaleTops || 0}</span>
                    </td>
                    <td class="points-col total">{athlete.totalPoints}</td>
                  </tr>
                {/each}
              </tbody>
            </table>
          {:else}
            <p class="no-athletes">Keine Athleten in dieser Startklasse</p>
          {/if}
        </div>
      {/each}
    {:else}
      <div class="empty-state">
        <p>Keine Ergebnisse verfügbar.</p>
      </div>
    {/if}
  {/if}
</div>

<style>
  .results-view {
    max-width: 1000px;
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
  
  .results-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 24px;
  }
  
  .results-header h2 {
    font-size: 24px;
  }
  
  .config-info {
    font-size: 14px;
    color: var(--color-text-muted);
  }
  
  .group-results {
    margin-bottom: 24px;
  }
  
  .group-title {
    font-size: 20px;
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 2px solid var(--color-primary);
  }
  
  .results-table {
    width: 100%;
    border-collapse: collapse;
  }
  
  .results-table th,
  .results-table td {
    padding: 12px;
    text-align: left;
    border-bottom: 1px solid var(--color-border);
  }
  
  .results-table th {
    font-size: 12px;
    text-transform: uppercase;
    color: var(--color-text-muted);
    font-weight: 600;
  }
  
  .results-table tr:last-child td {
    border-bottom: none;
  }
  
  .results-table tr.gold {
    background: rgba(255, 215, 0, 0.1);
  }
  
  .results-table tr.silver {
    background: rgba(192, 192, 192, 0.1);
  }
  
  .results-table tr.bronze {
    background: rgba(205, 127, 50, 0.1);
  }
  
  .rank-col {
    width: 60px;
    text-align: center;
    font-size: 18px;
  }
  
  .name-col {
    font-weight: 500;
  }
  
  .stat-col {
    text-align: center;
  }
  
  .stat-value {
    font-weight: 700;
    font-size: 16px;
  }
  
  .stat-value.top {
    color: var(--color-primary);
  }
  
  .stat-value.zone {
    color: #f39c12;
  }
  
  .stat-value.bonus {
    color: var(--color-secondary);
  }
  
  .stat-value.finale {
    color: #9b59b6;
  }
  
  .points-col.total {
    font-size: 20px;
    font-weight: 700;
    color: var(--color-primary);
    text-align: right;
  }
  
  .no-athletes {
    text-align: center;
    color: var(--color-text-muted);
    padding: 20px;
  }
  
  .empty-state {
    text-align: center;
    padding: 60px;
    color: var(--color-text-muted);
  }
</style>
