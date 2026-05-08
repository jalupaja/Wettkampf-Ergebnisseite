<script>
  import { onMount } from 'svelte';
  import { api } from '../../api.js';
  
  import CompetitionStates from '../../../../../shared/competitionStates.js';

  let competitionState = $state(CompetitionStates.SETUP);
  let loading = $state(true);
  let error = $state('');

  const states = [
    { value: CompetitionStates.SETUP, label: 'Setup', description: 'Routen und Athleten werden vorbereitet' },
    { value: CompetitionStates.QUALIFICATION, label: 'Qualifikation', description: 'Athleten klettern Qualifikation und Bonus' },
    { value: CompetitionStates.FINALE, label: 'Finale', description: 'Finalisten klettern die Finalrouten' },
    { value: CompetitionStates.FINISHED, label: 'Beendet', description: 'Wettkampf beendet, Ergebnisse einsehbar' }
  ];
  
  onMount(async () => {
    await loadState();
  });
  
  async function loadState() {
    loading = true;
    try {
      const data = await api.config.get();
      competitionState = data.config.competitionState || CompetitionStates.SETUP;
    } catch (err) {
      error = err.message;
    }
    loading = false;
  }
  
  async function setState(newState) {
    try {
      await api.config.update({ competitionState: newState });
      competitionState = newState;
    } catch (err) {
      error = err.message;
    }
  }
</script>

<div class="status-control">
  <h2>Wettkampf-Status</h2>
  
  {#if error}
    <div class="error-message">{error}</div>
  {/if}
  
  {#if loading}
    <div class="loading">Laden...</div>
  {:else}
    <div class="state-cards">
      {#each states as state}
        <div 
          class="state-card"
          class:active={competitionState === state.value}
        >
          <div class="state-header">
            <span class="state-label">{state.label}</span>
            {#if competitionState === state.value}
              <span class="state-badge">Aktiv</span>
            {/if}
          </div>
          <p class="state-description">{state.description}</p>
          <button 
            class="primary"
            onclick={() => setState(state.value)}
            disabled={competitionState === state.value}
          >
            {competitionState === state.value ? 'Aktiv' : 'Starten'}
          </button>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .status-control {
    max-width: 800px;
  }
  
  h2 {
    font-size: 24px;
    margin-bottom: 24px;
  }
  
  .error-message {
    background: rgba(231, 76, 60, 0.1);
    border: 1px solid var(--color-error);
    color: var(--color-error);
    padding: 12px;
    border-radius: 8px;
    margin-bottom: 16px;
  }
  
  .loading {
    text-align: center;
    padding: 40px;
    color: var(--color-text-muted);
  }
  
  .state-cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 16px;
  }
  
  .state-card {
    background: var(--color-bg-light);
    border: 2px solid var(--color-border);
    border-radius: 12px;
    padding: 20px;
    text-align: center;
    transition: all 0.2s ease;
  }
  
  .state-card.active {
    border-color: var(--color-primary);
    background: rgba(255, 107, 0, 0.05);
  }
  
  .state-header {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    margin-bottom: 8px;
  }
  
  .state-label {
    font-size: 20px;
    font-weight: 600;
  }
  
  .state-badge {
    background: var(--color-primary);
    color: var(--color-white);
    padding: 2px 10px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 600;
  }
  
  .state-description {
    font-size: 13px;
    color: var(--color-text-muted);
    margin-bottom: 16px;
    min-height: 40px;
  }
  
  .state-card button {
    width: 100%;
  }
  
  .state-card button:disabled {
    background: var(--color-secondary);
    opacity: 1;
  }
</style>
