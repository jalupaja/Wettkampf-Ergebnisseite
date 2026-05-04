<script>
  import { userStore } from '../stores/user.js';
  import { formatPoints } from '../utils/formatters.js';
  
  let { results = [], loading = false, error = '', config = null } = $props();
  
  function isCurrentUser(userId) {
    const user = $userStore;
    return user && user.id === userId;
  }

  function getNumFinalists(athleteCount) {
    if (!config) return 0;
    const threshold = config.finaleSmallGroupThreshold || 10;
    const maxAthletes = config.finaleMaxAthletes || 8;
    const smallGroupMax = config.finaleSmallGroupMaxAthletes || 6;
    return athleteCount >= threshold ? maxAthletes : smallGroupMax;
  }

  function getFinalistsByRole(athletes) {
    return athletes.filter(a => a.role === 'finalist');
  }

  let currentUserRole = $state(null);
  $effect(() => {
    const unsubscribe = userStore.subscribe(user => {
      currentUserRole = user?.role ?? null;
    });
    return unsubscribe;
  });

</script>

{#if error}
  <div class="error-message">{error}</div>
{/if}


  
{#snippet resultsTable(athletes, showMedals, pointsType = 'total', showStats = true)}
   <table class="results-table">
     <thead>
       <tr>
         <th class="rank-col">Platz</th>
         <th class="name-col">Name</th>
         <th class="points-col">Punkte</th>
         {#if showStats}
           <th class="stat-col">T</th>
           <th class="stat-col">Z</th>
           <th class="stat-col">B</th>
         {/if}
       </tr>
     </thead>
     <tbody>
       {#each athletes as athlete, index}
         <tr class:me={isCurrentUser(athlete.userId)}>
           <td class="rank-col">
             {#if showMedals && index === 0}🥇{:else if showMedals && index === 1}🥈{:else if showMedals && index === 2}🥉{:else}{index + 1}{/if}
           </td>
            <td class="name-col">{athlete.username}</td>
            <td class="points-col">
              {#if pointsType === 'finale'}
                {formatPoints(athlete.finalePoints ?? 0)}
              {:else if pointsType === 'qualification'}
                {formatPoints(athlete.qualPoints ?? 0)}
              {:else}
                {formatPoints(athlete.totalPoints ?? 0)}
              {/if}
            </td>
           {#if showStats}
             <td class="stat-col"><span class="stat-value top">{athlete.qualTops ?? 0}</span></td>
             <td class="stat-col"><span class="stat-value zone">{athlete.qualZones ?? 0}</span></td>
             <td class="stat-col"><span class="stat-value bonus">{athlete.bonusTops ?? 0}</span></td>
           {/if}
         </tr>
       {/each}
     </tbody>
   </table>
{/snippet}

  {#if loading}
    <div class="loading">Rangliste wird geladen...</div>
  {:else if results.length}
    {#if config?.competitionState === 'finale' || config?.competitionState === 'finished'}
      <div class="round-section finale-phase">
         <h2 class="round-title finale phase-heading">Finale</h2>
         {#each results as groupResult}
           {@const finalists = getFinalistsByRole(groupResult.athletes)}
           {#if finalists.length > 0}
             <div class="group-results card">
               <h3 class="group-title">{groupResult.groupName}</h3>
               {@render resultsTable(finalists, true, 'finale', false)}
             </div>
           {/if}
         {/each}
      </div>

         <div class="round-section qualifikation-phase">
           <h2 class="round-title qualifikation phase-heading">Qualifikation</h2>
           {#each results as groupResult}
             <div class="group-results card">
               <h3 class="group-title">{groupResult.groupName}</h3>
               {#if groupResult.athletes.length}
                 {@render resultsTable(groupResult.athletes, false, 'qualification', true)}
               {:else}
                 <p class="no-athletes">Keine Athleten in dieser Startklasse</p>
               {/if}
             </div>
           {/each}
         </div>
    {:else}
      {#each results as groupResult}
        <div class="group-results card">
          <h3 class="group-title">{groupResult.groupName}</h3>
          {#if groupResult.athletes.length}
            {@render resultsTable(groupResult.athletes, false, false, true)}
          {:else}
            <p class="no-athletes">Keine Athleten in dieser Startklasse</p>
          {/if}
        </div>
      {/each}
    {/if}

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
  
  .results-table { width: 100%; border-collapse: collapse; min-width: 400px; table-layout: fixed; }
  
  .results-table th, .results-table td { padding: 12px; text-align: left; border-bottom: 1px solid var(--color-border); }
  
  .results-table th { font-size: 12px; text-transform: uppercase; color: var(--color-text); font-weight: 600; }
  
  .results-table tr:last-child td { border-bottom: none; }
  .results-table tr.me { background: rgba(255, 107, 0, 0.1); }
  .results-table tr.me td.name-col { font-weight: 700; }
  
  .rank-col { width: 75px; text-align: center; font-size: 16px; white-space: nowrap; }
  .name-col { font-weight: 500; width: 180px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .points-col { text-align: left; font-weight: 700; font-size: 16px; color: var(--color-primary); width: auto; }
  .stat-col { text-align: center; width: 45px; }
  .stat-value { font-weight: 700; font-size: 15px; }
  .stat-value.top { color: var(--color-primary); }
  .stat-value.zone { color: var(--color-zone); }
  .stat-value.bonus { color: var(--color-secondary); }
  
  .no-athletes { text-align: center; color: var(--color-text); padding: 20px; }
  .empty-state { text-align: center; padding: 60px; color: var(--color-text); }
  
  @media (max-width: 640px) {
    .results-table th, .results-table td { padding: 10px 6px; }
    .stat-value, .points-col, .rank-col { font-size: 14px; }
    .name-col { width: 120px; }
  }

  .round-section { margin-bottom: 24px; }
  .round-title { font-size: 16px; margin-bottom: 12px; color: var(--color-text-muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
  .round-title.finale { color: var(--color-finale); }
  .round-title.qualifikation { color: var(--color-primary); }

  .phase-heading { font-size: 24px; margin-bottom: 20px; border-bottom: 2px solid; padding-bottom: 8px; }
  .round-title.finale.phase-heading { border-bottom-color: var(--color-finale); }
  .round-title.qualifikation.phase-heading { border-bottom-color: var(--color-primary); }
</style>
