<script>
  import { onMount } from 'svelte';
  import { api } from '../../api.js';
  
  let routes = $state([]);
  let loading = $state(true);
  let error = $state('');
  let showModal = $state(false);
  let importMode = $state('append');
  let importing = $state(false);
  
  let formData = $state({
    name: '',
    category: 'qualification',
    topPoints: 100,
    zones: [],
    order: null
  });
  
  let editingId = $state(null);
  
  const categories = [
    { value: 'qualification', label: 'Qualifikation' },
    { value: 'bonus', label: 'Bonus' },
    { value: 'finale', label: 'Finale' }
  ];
  
  onMount(async () => {
    await loadRoutes();
  });
  
  function handleExport() {
    window.open('/api/admin/data/routes', '_blank');
  }
  
  function parseCSV(text) {
    const lines = text.split('\n').filter(l => l.trim());
    if (lines.length < 2) return [];
    const headers = lines[0].split(',').map(h => h.trim());
    const data = [];
    for (let i = 1; i < lines.length; i++) {
      const values = [];
      let current = '';
      let inQuotes = false;
      for (const char of lines[i]) {
        if (char === '"') { inQuotes = !inQuotes; }
        else if (char === ',' && !inQuotes) { values.push(current.trim()); current = ''; }
        else { current += char; }
      }
      values.push(current.trim());
      const row = {};
      headers.forEach((h, idx) => {
        let val = values[idx] || '';
        if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1).replace(/""/g, '"');
        row[h] = val;
      });
      data.push(row);
    }
    return data;
  }
  
  async function handleImport(event) {
    const file = event.target.files[0];
    if (!file) return;
    importing = true;
    error = '';
    try {
      const text = await file.text();
      const data = parseCSV(text);
      if (data.length === 0) { error = 'CSV-Datei ist leer'; importing = false; return; }
      await api.data.importRoutes(importMode, data);
      await loadRoutes();
      alert(`Import erfolgreich!`);
    } catch (err) {
      error = err.message;
    }
    importing = false;
    event.target.value = '';
  }
  
  async function loadRoutes() {
    loading = true;
    error = '';
    try {
      const data = await api.routes.admin.list();
      routes = data.routes;
    } catch (err) {
      error = err.message;
    }
    loading = false;
  }
  
  function openModal(route = null) {
    if (route) {
      editingId = route.id;
      formData = {
        name: route.name,
        category: route.category,
        topPoints: route.topPoints || route.points || 100,
        zones: route.zones || [],
        order: route.order
      };
    } else {
      editingId = null;
      const maxOrder = Math.max(...routes.map(r => r.order), 0);
      formData = {
        name: '',
        category: 'qualification',
        topPoints: 100,
        zones: [],
        order: maxOrder + 1
      };
    }
    showModal = true;
  }
  
  function closeModal() {
    showModal = false;
    editingId = null;
  }
  
  function addZone() {
    formData.zones = [...formData.zones, { name: `Zone ${formData.zones.length + 1}`, points: 25 }];
  }
  
  function removeZone(index) {
    formData.zones = formData.zones.filter((_, i) => i !== index);
  }
  
  function updateZone(index, field, value) {
    formData.zones = formData.zones.map((zone, i) => {
      if (i === index) {
        return { ...zone, [field]: field === 'points' ? parseInt(value) || 0 : value };
      }
      return zone;
    });
  }
  
  async function handleSubmit() {
    error = '';
    try {
      const payload = { ...formData };
      if (!payload.order) delete payload.order;
      
      if (editingId) {
        await api.routes.admin.update(editingId, payload);
      } else {
        await api.routes.admin.create(payload);
      }
      
      await loadRoutes();
      closeModal();
    } catch (err) {
      error = err.message;
    }
  }
  
  async function deleteRoute(id) {
    if (!confirm('Route wirklich löschen?')) return;
    
    try {
      await api.routes.admin.delete(id);
      await loadRoutes();
    } catch (err) {
      error = err.message;
    }
  }
  
  async function moveRoute(id, direction) {
    const index = routes.findIndex(r => r.id === id);
    if (index === -1) return;
    
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= routes.length) return;
    
    const route = routes[index];
    const neighbor = routes[newIndex];
    
    try {
      await api.routes.admin.update(id, { order: neighbor.order });
      await api.routes.admin.update(neighbor.id, { order: route.order });
      await loadRoutes();
    } catch (err) {
      error = err.message;
    }
  }
  
  const qualRoutes = $derived(routes.filter(r => r.category === 'qualification'));
  const bonusRoutes = $derived(routes.filter(r => r.category === 'bonus'));
  const finaleRoutes = $derived(routes.filter(r => r.category === 'finale'));
</script>

<div class="routes-management">
  <div class="header">
    <h2>Routen-Verwaltung</h2>
    <div class="header-actions">
      <div class="import-group">
        <select bind:value={importMode} class="mode-select">
          <option value="append">Anhängen</option>
          <option value="replace">Ersetzen</option>
        </select>
        <input type="file" accept=".csv" id="routes-import" onchange={handleImport} disabled={importing} class="hidden-input" />
        <label for="routes-import" class="outline btn-sm">{importing ? 'Importieren...' : 'Import'}</label>
      </div>
      <button class="outline btn-sm" onclick={handleExport}>Export</button>
      <button class="primary" onclick={() => openModal()}>
        + Neue Route
      </button>
    </div>
  </div>
  
  {#if error}
    <div class="error-message">{error}</div>
  {/if}
  
  {#if loading}
    <div class="loading">Laden...</div>
  {:else}
    <div class="routes-sections">
      <section class="route-section">
        <h3>Qualifikation ({qualRoutes.length})</h3>
        <div class="routes-list">
          {#each qualRoutes as route, index}
            <div class="route-card">
              <div class="route-order">{route.order}</div>
              <div class="route-info">
                <span class="route-name">{route.name}</span>
                <span class="route-meta">Top: {route.topPoints} Punkte | Zonen: {route.zones?.length || 0}</span>
              </div>
              <div class="route-actions">
                <button class="outline btn-sm" onclick={() => moveRoute(route.id, 'up')} disabled={index === 0}>↑</button>
                <button class="outline btn-sm" onclick={() => moveRoute(route.id, 'down')} disabled={index === qualRoutes.length - 1}>↓</button>
                <button class="outline btn-sm" onclick={() => openModal(route)}>Bearbeiten</button>
                <button class="danger btn-sm" onclick={() => deleteRoute(route.id)}>Löschen</button>
              </div>
            </div>
          {/each}
        </div>
      </section>
      
      <section class="route-section">
        <h3>Bonus ({bonusRoutes.length})</h3>
        <div class="routes-list">
          {#each bonusRoutes as route, index}
            <div class="route-card bonus">
              <div class="route-order">{route.order}</div>
              <div class="route-info">
                <span class="route-name">{route.name}</span>
                <span class="route-meta">{route.topPoints} Punkte pro Top</span>
              </div>
              <div class="route-actions">
                <button class="outline btn-sm" onclick={() => moveRoute(route.id, 'up')} disabled={index === 0}>↑</button>
                <button class="outline btn-sm" onclick={() => moveRoute(route.id, 'down')} disabled={index === bonusRoutes.length - 1}>↓</button>
                <button class="outline btn-sm" onclick={() => openModal(route)}>Bearbeiten</button>
                <button class="danger btn-sm" onclick={() => deleteRoute(route.id)}>Löschen</button>
              </div>
            </div>
          {/each}
        </div>
      </section>
      
      <section class="route-section">
        <h3>Finale ({finaleRoutes.length})</h3>
        <div class="routes-list">
          {#each finaleRoutes as route, index}
            <div class="route-card finale">
              <div class="route-order">{route.order}</div>
              <div class="route-info">
                <span class="route-name">{route.name}</span>
              </div>
              <div class="route-actions">
                <button class="outline btn-sm" onclick={() => moveRoute(route.id, 'up')} disabled={index === 0}>↑</button>
                <button class="outline btn-sm" onclick={() => moveRoute(route.id, 'down')} disabled={index === finaleRoutes.length - 1}>↓</button>
                <button class="outline btn-sm" onclick={() => openModal(route)}>Bearbeiten</button>
                <button class="danger btn-sm" onclick={() => deleteRoute(route.id)}>Löschen</button>
              </div>
            </div>
          {/each}
        </div>
      </section>
      
      {#if !routes.length}
        <div class="empty-state card">
          <p>Keine Routen vorhanden.</p>
        </div>
      {/if}
    </div>
  {/if}
  
  {#if showModal}
    <div class="modal-overlay" role="dialog" aria-modal="true" onclick={closeModal} onkeydown={(e) => e.key === 'Escape' && closeModal()} tabindex="-1" aria-label="Dialog">
      <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
      <div class="modal" role="document" onclick={(e) => e.stopPropagation()} onkeydown={(e) => e.stopPropagation()}>
        <h3>{editingId ? 'Route bearbeiten' : 'Neue Route'}</h3>
        
        <form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
          {#if error}
            <div class="error-message">{error}</div>
          {/if}
          
          <div class="form-group">
            <label for="name">Name</label>
            <input
              type="text"
              id="name"
              bind:value={formData.name}
              placeholder="z.B. Route 1"
              required
            />
          </div>
          
          <div class="form-group">
            <label for="category">Kategorie</label>
            <select id="category" bind:value={formData.category}>
              {#each categories as cat}
                <option value={cat.value}>{cat.label}</option>
              {/each}
            </select>
          </div>
          
          <div class="form-group">
            <label for="topPoints">Top Punkte</label>
            <input
              type="number"
              id="topPoints"
              bind:value={formData.topPoints}
              min="0"
              required
            />
          </div>
          
          {#if formData.category === 'qualification'}
            <div class="form-group">
              <div class="zone-header">
                <span class="zone-label">Zonen</span>
                <button type="button" class="outline btn-sm" onclick={addZone}>+ Zone hinzufügen</button>
              </div>
              {#if formData.zones.length === 0}
                <p class="zone-hint">Keine Zonen konfiguriert. Athleten können nur "Versuch" oder "Top" auswählen.</p>
              {:else}
                <div class="zones-list">
                  {#each formData.zones as zone, index}
                    <div class="zone-item">
                      <input
                        type="text"
                        value={zone.name}
                        oninput={(e) => updateZone(index, 'name', e.target.value)}
                        placeholder="Zone Name"
                        class="zone-name-input"
                      />
                      <input
                        type="number"
                        value={zone.points}
                        oninput={(e) => updateZone(index, 'points', e.target.value)}
                        placeholder="Punkte"
                        class="zone-points-input"
                      />
                      <button type="button" class="danger btn-sm" onclick={() => removeZone(index)}>×</button>
                    </div>
                  {/each}
                </div>
              {/if}
            </div>
          {/if}
          
          <div class="form-group">
            <label for="order">Reihenfolge</label>
            <input
              type="number"
              id="order"
              bind:value={formData.order}
              min="1"
            />
          </div>
          
          <div class="modal-actions">
            <button type="button" class="outline" onclick={closeModal}>
              Abbrechen
            </button>
            <button type="submit" class="primary">
              {editingId ? 'Speichern' : 'Erstellen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  {/if}
</div>

<style>
  .routes-management {
    max-width: 900px;
  }
  
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
  }
  
  .header h2 {
    font-size: 24px;
  }
  
  .header-actions {
    display: flex;
    gap: 8px;
    align-items: center;
  }
  
  .import-group {
    display: flex;
    gap: 4px;
    align-items: center;
  }
  
  .mode-select {
    width: auto;
    padding: 6px 10px;
    font-size: 12px;
  }
  
  .hidden-input {
    display: none;
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
  
  .routes-sections {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }
  
  .route-section h3 {
    font-size: 16px;
    margin-bottom: 12px;
    color: var(--color-text-muted);
  }
  
  .routes-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  
  .route-card {
    display: flex;
    align-items: center;
    gap: 12px;
    background: var(--color-bg-light);
    border: 1px solid var(--color-border);
    border-radius: 8px;
    padding: 12px 16px;
  }
  
  .route-card.bonus {
    border-left: 3px solid var(--color-secondary);
  }
  
  .route-card.finale {
    border-left: 3px solid #9b59b6;
  }
  
  .route-order {
    width: 32px;
    height: 32px;
    background: var(--color-bg-lighter);
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    font-size: 14px;
    color: var(--color-text-muted);
  }
  
  .route-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  
  .route-name {
    font-weight: 500;
  }
  
  .route-meta {
    font-size: 12px;
    color: var(--color-text-muted);
  }
  
  .route-actions {
    display: flex;
    gap: 6px;
  }
  
  .empty-state {
    text-align: center;
    padding: 40px;
    color: var(--color-text-muted);
  }
  
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }
  
  .modal {
    background: var(--color-bg-light);
    border-radius: 16px;
    padding: 32px;
    width: 100%;
    max-width: 500px;
    border: 1px solid var(--color-border);
    max-height: 90vh;
    overflow-y: auto;
  }
  
  .modal h3 {
    margin-bottom: 24px;
    font-size: 20px;
  }
  
  .zone-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }
  
  .zone-label {
    font-weight: 500;
    color: var(--color-text);
  }
  
  .zone-hint {
    font-size: 13px;
    color: var(--color-text-muted);
    font-style: italic;
  }
  
  .zones-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: 8px;
  }
  
  .zone-item {
    display: flex;
    gap: 8px;
    align-items: center;
  }
  
  .zone-name-input {
    flex: 1;
  }
  
  .zone-points-input {
    width: 80px;
  }
  
  .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 24px;
  }
</style>
