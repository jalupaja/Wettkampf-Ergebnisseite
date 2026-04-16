<script>
  import { onMount } from 'svelte';
  import { api } from '../../api.js';
  
  let config = $state({
    qualificationBestCount: 5,
    finaleMaxAthletes: 8,
    finaleSmallGroupMaxAthletes: 6,
    finaleSmallGroupThreshold: 10
  });
  let groups = $state([]);
  let loading = $state(true);
  let error = $state('');
  let success = $state('');
  
  onMount(async () => {
    await loadConfig();
  });
  
  async function loadConfig() {
    loading = true;
    error = '';
    try {
      const data = await api.config.get();
      config = { ...config, ...data.config };
      groups = data.groups || [];
    } catch (err) {
      error = err.message;
    }
    loading = false;
  }
  
  async function handleSubmit() {
    error = '';
    success = '';
    try {
      await api.config.update({
        qualificationBestCount: parseInt(config.qualificationBestCount) || 5,
        finaleMaxAthletes: parseInt(config.finaleMaxAthletes) || 8,
        finaleSmallGroupMaxAthletes: parseInt(config.finaleSmallGroupMaxAthletes) || 6,
        finaleSmallGroupThreshold: parseInt(config.finaleSmallGroupThreshold) || 10
      });
      success = 'Einstellungen gespeichert!';
      setTimeout(() => success = '', 3000);
    } catch (err) {
      error = err.message;
    }
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

<div class="config-management">
  <h2>Einstellungen</h2>
  
  {#if error}
    <div class="error-message">{error}</div>
  {/if}
  
  {#if success}
    <div class="success-message">{success}</div>
  {/if}
  
  {#if loading}
    <div class="loading">Laden...</div>
  {:else}
    <div class="card config-form">
      <form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
        <div class="form-group">
          <label for="qualificationBestCount">
            Anzahl gewertete Qualifikationsrouten
          </label>
          <input
            type="number"
            id="qualificationBestCount"
            bind:value={config.qualificationBestCount}
            min="1"
            max="20"
          />
          <span class="hint">
            Top X Routen werden für die Wertung herangezogen
          </span>
        </div>
        
        <div class="form-group finalist-config">
          <span class="config-label">Finalisten</span>
          <div class="finalist-inputs">
            <div class="finalist-input-group">
              <input 
                type="number" 
                bind:value={config.finaleSmallGroupMaxAthletes}
                min="0"
              />
              <span class="finalist-label">&lt; {config.finaleSmallGroupThreshold || 10}</span>
            </div>
            <div class="finalist-input-group">
              <input 
                type="number" 
                bind:value={config.finaleSmallGroupThreshold}
                min="1"
              />
              <span class="finalist-label">Schwelle</span>
            </div>
            <div class="finalist-input-group">
              <input 
                type="number" 
                bind:value={config.finaleMaxAthletes}
                min="0"
              />
              <span class="finalist-label">≥ {config.finaleSmallGroupThreshold || 10}</span>
            </div>
          </div>
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
        
        <button type="submit" class="primary">
          Speichern
        </button>
      </form>
    </div>
  {/if}
</div>

<style>
  .config-management {
    max-width: 600px;
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
  
  .success-message {
    background: rgba(46, 204, 113, 0.1);
    border: 1px solid var(--color-success);
    color: var(--color-success);
    padding: 12px;
    border-radius: 8px;
    margin-bottom: 16px;
  }
  
  .loading {
    text-align: center;
    padding: 40px;
    color: var(--color-text-muted);
  }
  
  .config-form form {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
  
  .hint {
    display: block;
    font-size: 13px;
    color: var(--color-text-muted);
    margin-top: 6px;
  }
  
  .finalist-config {
    margin-bottom: 8px;
  }
  
  .config-label {
    display: block;
    font-weight: 500;
    margin-bottom: 8px;
  }
  
  .finalist-inputs {
    display: flex;
    gap: 12px;
    align-items: center;
  }
  
  .finalist-input-group {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  }
  
  .finalist-input-group input {
    width: 70px;
    text-align: center;
  }
  
  .finalist-label {
    font-size: 11px;
    color: var(--color-text-muted);
    white-space: nowrap;
  }
  
  .groups-preview {
    background: var(--color-bg-lighter);
    border-radius: 8px;
    padding: 16px;
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
