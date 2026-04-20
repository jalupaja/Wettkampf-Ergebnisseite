<script>
  import { onMount } from 'svelte';
  import { api } from '../../api.js';
  
  let config = $state({
    qualificationBestCount: 4,
    finaleMaxAthletes: 5,
    finaleSmallGroupMaxAthletes: 3,
    finaleSmallGroupThreshold: 10,
    rulesUrl: ''
  });
  let groups = $state([]);
  let loading = $state(true);
  let error = $state('');
  let success = $state('');
  let importing = $state(false);
  
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
        qualificationBestCount: parseInt(config.qualificationBestCount) || 4,
        finaleMaxAthletes: parseInt(config.finaleMaxAthletes) || 5,
        finaleSmallGroupMaxAthletes: parseInt(config.finaleSmallGroupMaxAthletes) || 3,
        finaleSmallGroupThreshold: parseInt(config.finaleSmallGroupThreshold) || 10,
        rulesUrl: config.rulesUrl || ''
      });
      success = 'Einstellungen gespeichert!';
      setTimeout(() => success = '', 3000);
    } catch (err) {
      error = err.message;
    }
  }
  
  function getFinalistCount(groupSize) {
    const threshold = config.finaleSmallGroupThreshold || 10;
    const maxAthletes = config.finaleMaxAthletes || 5;
    const smallGroupMax = config.finaleSmallGroupMaxAthletes || 3;
    
    if (groupSize < threshold) {
      return Math.min(smallGroupMax, groupSize);
    }
    return Math.min(maxAthletes, groupSize);
  }
  
  function handleExport() {
    window.open('/api/admin/data/config', '_blank');
  }

  function parseConfigCSV(text) {
    const lines = text.split('\n').filter(l => l.trim());
    if (lines.length < 2) return {};

    const out = {};
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      const commaIndex = line.indexOf(',');
      if (commaIndex === -1) continue;
      const key = line.slice(0, commaIndex).trim();
      let value = line.slice(commaIndex + 1).trim();
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1).replace(/""/g, '"');
      }
      out[key] = value;
    }
    return out;
  }

  async function handleImport(event) {
    const file = event.target.files[0];
    if (!file) return;
    importing = true;
    error = '';
    success = '';
    try {
      const text = await file.text();
      const data = parseConfigCSV(text);
      if (Object.keys(data).length === 0) {
        error = 'CSV-Datei ist leer';
        importing = false;
        return;
      }
      await api.data.importConfig(data);
      await loadConfig();
          } catch (err) {
      error = err.message;
    }
    importing = false;
    event.target.value = '';
  }
</script>

<div class="config-management">
  <div class="header">
    <h2>Einstellungen</h2>
    <div class="header-actions">
      <input type="file" accept=".csv" id="config-import" onchange={handleImport} disabled={importing} class="hidden-input" />
      <label for="config-import" class="outline btn-sm">{importing ? 'Importieren...' : 'Import'}</label>
      <button type="button" class="outline btn-sm" onclick={handleExport}>Export</button>
    </div>
  </div>
  
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
          <label for="rulesUrl">
            Link zu den Regeln
          </label>
          <input
            type="url"
            id="rulesUrl"
            bind:value={config.rulesUrl}
            placeholder="https://..."
          />
        </div>
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
  
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
  }

  .header-actions {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .hidden-input {
    display: none;
  }
  
  h2 {
    font-size: 24px;
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
