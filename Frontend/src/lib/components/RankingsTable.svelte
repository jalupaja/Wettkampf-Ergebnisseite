<script>
  import { userStore } from '../stores/user.js';
  
  let { results = [], loading = false, error = '' } = $props();
  
  function isCurrentUser(userId) {
    const user = $userStore;
    return user && user.id === userId;
  }
</script>

{#if error}
  <div class="error-message">{error}</div>
{/if}

{#if loading}
  <div class="loading">Rangliste wird geladen...</div>
{:else if results.length}
  {#each results as groupResult}
    <div class="group-results card">
      <h3 class="group-title">{groupResult.groupName}</h3>
      
      {#if groupResult.athletes.length}
        <table class="results-table">
          <thead>
            <tr>
              <th class="rank-col">Platz</th>
              <th class="name-col">Name</th>
              <th class="points-col">Punkte</th>
              <th class="stat-col">T</th>
              <th class="stat-col">Z</th>
              <th class="stat-col">B</th>
            </tr>
          </thead>
          <tbody>
            {#each groupResult.athletes as athlete, index}
              <tr class:gold={index === 0} class:silver={index === 1} class:bronze={index === 2} class:me={isCurrentUser(athlete.userId)}>
                <td class="rank-col">
                  {#if index === 0}🥇{:else if index === 1}🥈{:else if index === 2}🥉{:else}{index + 1}{/if}
                </td>
                <td class="name-col">{athlete.username}</td>
                <td class="points-col">{athlete.totalPoints}</td>
                <td class="stat-col"><span class="stat-value top">{athlete.qualTops}</span></td>
                <td class="stat-col"><span class="stat-value zone">{athlete.qualZones}</span></td>
                <td class="stat-col"><span class="stat-value bonus">{athlete.bonusTops}</span></td>
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

<style>
  .error-message {
    background: rgba(231, 76, 60, 0.1);
    border: 1px solid var(--color-error);
    color: var(--color-error);
    padding: 12px;
    border-radius: 8px;
    margin-bottom: 20px;
  }
  
  .loading { text-align: center; padding: 40px; color: var(--color-text); }
  
  .group-results { margin-bottom: 24px; overflow-x: auto; }
  
  .group-title {
    font-size: 20px;
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 2px solid var(--color-primary);
  }
  
  .results-table { width: 100%; border-collapse: collapse; min-width: 400px; }
  
  .results-table th, .results-table td { padding: 12px; text-align: left; border-bottom: 1px solid var(--color-border); }
  
  .results-table th { font-size: 12px; text-transform: uppercase; color: var(--color-text); font-weight: 600; }
  
  .results-table tr:last-child td { border-bottom: none; }
  .results-table tr.gold { background: rgba(255, 215, 0, 0.1); }
  .results-table tr.silver { background: rgba(192, 192, 192, 0.1); }
  .results-table tr.bronze { background: rgba(205, 127, 50, 0.1); }
  .results-table tr.me { background: rgba(255, 107, 0, 0.1); font-weight: 700; }
  .results-table tr.me td.name-col { font-weight: 700; }
  
  .rank-col { width: 50px; text-align: center; font-size: 16px; }
  .name-col { font-weight: 500; min-width: 100px; }
  .points-col { text-align: right; font-weight: 700; font-size: 16px; color: var(--color-primary); min-width: 60px; }
  .stat-col { text-align: center; }
  .stat-value { font-weight: 700; font-size: 15px; }
  .stat-value.top { color: var(--color-primary); }
  .stat-value.zone { color: var(--color-zone); }
  .stat-value.bonus { color: var(--color-secondary); }
  
  .no-athletes { text-align: center; color: var(--color-text); padding: 20px; }
  .empty-state { text-align: center; padding: 60px; color: var(--color-text); }
  
  @media (max-width: 640px) {
    .results-table th, .results-table td { padding: 10px 6px; }
    .stat-value, .points-col, .rank-col { font-size: 14px; }
  }
</style>
