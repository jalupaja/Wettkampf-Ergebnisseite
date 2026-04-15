<script>
  import { onMount } from 'svelte';
  import { api } from '../../api.js';
  
  let config = $state({
    qualificationBestCount: 5,
    finaleMaxAthletes: 8
  });
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
      config = data.config;
    } catch (err) {
      error = err.message;
    }
    loading = false;
  }
  
  async function handleSubmit() {
    error = '';
    success = '';
    try {
      await api.config.update(config);
      success = 'Einstellungen gespeichert!';
      setTimeout(() => success = '', 3000);
    } catch (err) {
      error = err.message;
    }
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
        
        <div class="form-group">
          <label for="finaleMaxAthletes">
            Maximale Athleten im Finale
          </label>
          <input
            type="number"
            id="finaleMaxAthletes"
            bind:value={config.finaleMaxAthletes}
            min="1"
            max="20"
          />
          <span class="hint">
            Anzahl der Athleten, die ins Finale kommen
          </span>
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
</style>
