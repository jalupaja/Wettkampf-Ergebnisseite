<script>
  import { api } from '../../api.js';
  
  let activeSection = $state('settings');
  let importing = $state(false);
  let importMode = $state('append');
  let error = $state('');
  let success = $state('');
  let importResults = $state(null);
  
  async function handleExport(type) {
    try {
      if (type === 'settings') {
        api.data.exportConfig();
      } else if (type === 'routes') {
        api.data.exportRoutes();
      } else if (type === 'users') {
        api.data.exportUsers();
      }
    } catch (err) {
      error = err.message;
    }
  }
  
  function handleFileSelect(event, type) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target.result;
      const lines = text.split('\n').filter(l => l.trim());
      
      if (lines.length < 2) {
        error = 'CSV-Datei ist leer oder ungültig';
        return;
      }
      
      const headers = lines[0].split(',').map(h => h.trim());
      const data = [];
      
      for (let i = 1; i < lines.length; i++) {
        const values = [];
        let current = '';
        let inQuotes = false;
        
        for (const char of lines[i]) {
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            values.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        values.push(current.trim());
        
        const row = {};
        headers.forEach((h, idx) => {
          let val = values[idx] || '';
          if (val.startsWith('"') && val.endsWith('"')) {
            val = val.slice(1, -1).replace(/""/g, '"');
          }
          row[h] = val;
        });
        data.push(row);
      }
      
      await importData(type, data);
    };
    reader.readAsText(file);
    event.target.value = '';
  }
  
  async function importData(type, data) {
    importing = true;
    error = '';
    success = '';
    importResults = null;
    
    try {
      if (type === 'settings') {
        const configData = {};
        data.forEach(row => {
          if (row.key) {
            if (row.value && !isNaN(row.value)) {
              configData[row.key] = parseInt(row.value);
            } else {
              configData[row.key] = row.value;
            }
          }
        });
        await api.data.importConfig(configData);
        success = 'Einstellungen erfolgreich importiert!';
      } else if (type === 'routes') {
        const result = await api.data.importRoutes(importMode, data);
        importResults = result.results;
        success = `Routen importiert: ${result.results.filter(r => !r.error).length} erfolgreich`;
      } else if (type === 'users') {
        const result = await api.data.importUsers(importMode, data);
        importResults = result.results;
        success = `Benutzer importiert: ${result.results.filter(r => !r.error).length} erfolgreich`;
      }
    } catch (err) {
      error = err.message;
    }
    
    importing = false;
  }
</script>

<div class="data-management">
  <h2>Datenverwaltung</h2>
  
  {#if error}
    <div class="error-message">{error}</div>
  {/if}
  
  {#if success}
    <div class="success-message">{success}</div>
  {/if}
  
  <div class="tabs">
    <button class:active={activeSection === 'settings'} onclick={() => activeSection = 'settings'}>
      Einstellungen
    </button>
    <button class:active={activeSection === 'routes'} onclick={() => activeSection = 'routes'}>
      Routen
    </button>
    <button class:active={activeSection === 'users'} onclick={() => activeSection = 'users'}>
      Benutzer
    </button>
  </div>
  
  <div class="section-content">
    {#if activeSection === 'settings'}
      <div class="card">
        <h3>Einstellungen exportieren/importieren</h3>
        <p class="description">
          Exportiert oder importiert die Wettkampf-Einstellungen wie Finalisten-Anzahl und Qualifikations-Modus.
        </p>
        <div class="actions">
          <button class="primary" onclick={() => handleExport('settings')}>
            ↓ Exportieren (CSV)
          </button>
        </div>
        <hr />
        <h4>Importieren</h4>
        <div class="import-area">
          <input 
            type="file" 
            accept=".csv"
            id="config-file"
            onchange={(e) => handleFileSelect(e, 'settings')}
          />
          <label for="config-file" class="file-label">
            CSV-Datei auswählen
          </label>
        </div>
      </div>
    {:else if activeSection === 'routes'}
      <div class="card">
        <h3>Routen exportieren/importieren</h3>
        <p class="description">
          Exportiert oder importiert alle Routen mit Zonen-Konfiguration.
        </p>
        <div class="actions">
          <button class="primary" onclick={() => handleExport('routes')}>
            ↓ Exportieren (CSV)
          </button>
        </div>
        <hr />
        <h4>Importieren</h4>
        <div class="import-mode">
          <label>
            <input type="radio" bind:group={importMode} value="append" />
            Anhängen (vorhandene Routen behalten)
          </label>
          <label>
            <input type="radio" bind:group={importMode} value="replace" />
            Ersetzen (alle vorhandenen Routen löschen)
          </label>
        </div>
        <div class="import-area">
          <input 
            type="file" 
            accept=".csv"
            id="routes-file"
            onchange={(e) => handleFileSelect(e, 'routes')}
            disabled={importing}
          />
          <label for="routes-file" class="file-label" class:disabled={importing}>
            CSV-Datei auswählen
          </label>
        </div>
      </div>
    {:else if activeSection === 'users'}
      <div class="card">
        <h3>Benutzer exportieren/importieren</h3>
        <p class="description">
          Exportiert oder importiert alle Benutzer mit Passwörtern und Ergebnissen.
        </p>
        <div class="actions">
          <button class="primary" onclick={() => handleExport('users')}>
            ↓ Exportieren (CSV)
          </button>
        </div>
        <hr />
        <h4>Importieren</h4>
        <div class="import-mode">
          <label>
            <input type="radio" bind:group={importMode} value="append" />
            Anhängen (vorhandene Benutzer behalten)
          </label>
          <label>
            <input type="radio" bind:group={importMode} value="replace" />
            Ersetzen (alle vorhandenen Athleten löschen)
          </label>
        </div>
        <div class="import-area">
          <input 
            type="file" 
            accept=".csv"
            id="users-file"
            onchange={(e) => handleFileSelect(e, 'users')}
            disabled={importing}
          />
          <label for="users-file" class="file-label" class:disabled={importing}>
            CSV-Datei auswählen
          </label>
        </div>
      </div>
    {/if}
    
    {#if importResults}
      <div class="results-card card">
        <h4>Import-Ergebnisse:</h4>
        <ul>
          {#each importResults as result}
            <li class:error={result.error}>
              {result.username || result.name}: 
              {#if result.error}
                <span class="error-text">Fehler: {result.error}</span>
              {:else}
                {result.action}
              {/if}
            </li>
          {/each}
        </ul>
      </div>
    {/if}
  </div>
</div>

<style>
  .data-management {
    max-width: 800px;
  }
  
  h2 {
    font-size: 24px;
    margin-bottom: 24px;
  }
  
  h3 {
    font-size: 18px;
    margin-bottom: 8px;
  }
  
  h4 {
    font-size: 14px;
    color: var(--color-text-muted);
    margin: 16px 0 8px;
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
  
  .tabs {
    display: flex;
    gap: 8px;
    margin-bottom: 20px;
  }
  
  .tabs button {
    background: var(--color-bg-light);
    border: 1px solid var(--color-border);
    padding: 10px 20px;
    color: var(--color-text);
    font-weight: 500;
  }
  
  .tabs button.active {
    background: var(--color-primary);
    border-color: var(--color-primary);
    color: white;
  }
  
  .section-content .card {
    margin-bottom: 16px;
  }
  
  .description {
    color: var(--color-text-muted);
    font-size: 14px;
    margin-bottom: 16px;
  }
  
  .actions {
    margin-bottom: 8px;
  }
  
  hr {
    border: none;
    border-top: 1px solid var(--color-border);
    margin: 20px 0;
  }
  
  .import-mode {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 16px;
  }
  
  .import-mode label {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
  }
  
  .import-area {
    margin-top: 8px;
  }
  
  .import-area input[type="file"] {
    display: none;
  }
  
  .file-label {
    display: inline-block;
    background: var(--color-bg-lighter);
    border: 1px dashed var(--color-border);
    padding: 20px 40px;
    border-radius: 8px;
    cursor: pointer;
    text-align: center;
    width: 100%;
  }
  
  .file-label:hover {
    border-color: var(--color-primary);
    color: var(--color-primary);
  }
  
  .file-label.disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .results-card {
    margin-top: 16px;
  }
  
  .results-card ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  
  .results-card li {
    padding: 6px 0;
    font-size: 14px;
  }
  
  .results-card li.error {
    color: var(--color-error);
  }
  
  .error-text {
    color: var(--color-error);
  }
</style>
