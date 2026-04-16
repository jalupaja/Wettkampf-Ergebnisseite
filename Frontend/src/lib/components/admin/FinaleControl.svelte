<script>
  import { onMount } from 'svelte';
  import { api } from '../../api.js';
  
  let competitionState = $state('setup');
  let config = $state({});
  let groups = $state([]);
  let loading = $state(true);
  let error = $state('');
  let saving = $state(false);
  let showSettings = $state(false);
  
  const states = [
    { value: 'setup', label: 'Setup', description: 'Routen und Athleten werden vorbereitet' },
    { value: 'qualification', label: 'Qualifikation', description: 'Athleten klettern Qualifikation und Bonus' },
    { value: 'finale', label: 'Finale', description: 'Finalisten klettern die Finalrouten' },
    { value: 'finished', label: 'Beendet', description: 'Wettkampf beendet, Ergebnisse einsehbar' }
  ];
  
  onMount(async () => {
    await loadState();
  });
  
  async function loadState() {
    loading = true;
    try {
      const data = await api.config.get();
      competitionState = data.config.competitionState || 'setup';
      config = data.config;
      groups = data.groups || [];
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
  
  async function saveConfig() {
    saving = true;
    error = '';
    try {
      await api.config.update({
        qualificationBestCount: parseInt(config.qualificationBestCount) || 5,
        finaleMaxAthletes: parseInt(config.finaleMaxAthletes) || 8,
        finaleSmallGroupMaxAthletes: parseInt(config.finaleSmallGroupMaxAthletes) || 6,
        finaleSmallGroupThreshold: parseInt(config.finaleSmallGroupThreshold) || 10
      });
      showSettings = false;
    } catch (err) {
      error = err.message;
    }
    saving = false;
  }
  
  function getFinalistCount(groupSize) {
    const threshold = config.finaleSmallGroupThreshold || 10;
    const maxAthletes = config.finaleMaxAthletes || 8;
    const smallGroupMax = config.finaleSmallGroupMaxAthletes || 6;
    
    if (groupSize < threshold) {
      return Math.min(smallGroupMax, groupSize);
    }
    return Math.min(maxAthletes, groupSize);
  }
</script>

<div class="finale-control">
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
    
    <div class="info-box">
      <h3>Aktuelle Phase: {states.find(s => s.value === competitionState)?.label}</h3>
      <ul>
        <li><strong>Setup:</strong> Vorbereitung des Wettkampfs</li>
        <li><strong>Qualifikation:</strong> Athleten können ihre Ergebnisse eintragen</li>
        <li><strong>Finale:</strong> Nur Finalisten können Finale-Routen klettern</li>
      </ul>
    </div>
    
    <div class="settings-section">
      <button class="outline" onclick={() => showSettings = !showSettings}>
        {showSettings ? 'Einstellungen ausblenden' : 'Einstellungen anzeigen'}
      </button>
      
      {#if showSettings}
        <div class="settings-box">
          <h3>Wettkampf-Einstellungen</h3>
          
          <div class="form-group">
            <label for="qualCount">Anzahl gewertete Qualifikationsrouten</label>
            <input 
              type="number" 
              id="qualCount"
              bind:value={config.qualificationBestCount}
              min="1"
            />
          </div>
          
          <div class="form-group">
            <label for="finaleMax">Finalisten (große Gruppen)</label>
            <input 
              type="number" 
              id="finaleMax"
              bind:value={config.finaleMaxAthletes}
              min="1"
            />
            <span class="hint">Wenn Gruppe ≥ {config.finaleSmallGroupThreshold || 10} Athleten hat</span>
          </div>
          
          <div class="form-group">
            <label for="smallGroupMax">Finalisten (kleine Gruppen)</label>
            <input 
              type="number" 
              id="smallGroupMax"
              bind:value={config.finaleSmallGroupMaxAthletes}
              min="1"
            />
          </div>
          
          <div class="form-group">
            <label for="threshold">Schwelle kleine Gruppe</label>
            <input 
              type="number" 
              id="threshold"
              bind:value={config.finaleSmallGroupThreshold}
              min="1"
            />
            <span class="hint">Gruppen mit weniger Athleten gelten als "klein"</span>
          </div>
          
          <div class="groups-preview">
            <h4>Vorschau Finalisten pro Gruppe:</h4>
            <ul>
              {#each groups as group}
                <li>
                  {group.name}: <strong>{getFinalistCount(group.athleteCount)}</strong> Finalisten 
                  ({group.athleteCount} Athleten)
                </li>
              {/each}
            </ul>
          </div>
          
          <button class="primary" onclick={saveConfig} disabled={saving}>
            {saving ? 'Speichern...' : 'Einstellungen speichern'}
          </button>
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .finale-control {
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
    margin-bottom: 32px;
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
    color: white;
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
  
  .info-box {
    background: var(--color-bg-light);
    border: 1px solid var(--color-border);
    border-radius: 12px;
    padding: 20px;
  }
  
  .info-box h3 {
    font-size: 16px;
    margin-bottom: 12px;
  }
  
  .info-box ul {
    list-style: none;
    padding: 0;
  }
  
  .info-box li {
    padding: 8px 0;
    border-bottom: 1px solid var(--color-border);
    font-size: 14px;
  }
  
  .info-box li:last-child {
    border-bottom: none;
  }
  
  .info-box strong {
    color: var(--color-primary);
  }
  
  .settings-section {
    margin-top: 32px;
  }
  
  .settings-box {
    background: var(--color-bg-light);
    border: 1px solid var(--color-border);
    border-radius: 12px;
    padding: 24px;
    margin-top: 16px;
  }
  
  .settings-box h3 {
    font-size: 18px;
    margin-bottom: 20px;
  }
  
  .settings-box .form-group {
    margin-bottom: 16px;
  }
  
  .settings-box label {
    display: block;
    font-weight: 500;
    margin-bottom: 6px;
  }
  
  .settings-box .hint {
    display: block;
    font-size: 12px;
    color: var(--color-text-muted);
    margin-top: 4px;
  }
  
  .groups-preview {
    background: var(--color-bg-lighter);
    border-radius: 8px;
    padding: 16px;
    margin: 20px 0;
  }
  
  .groups-preview h4 {
    font-size: 14px;
    margin-bottom: 12px;
    color: var(--color-text-muted);
  }
  
  .groups-preview ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  
  .groups-preview li {
    padding: 6px 0;
    font-size: 14px;
  }
  
  .groups-preview li strong {
    color: var(--color-primary);
  }
</style>
