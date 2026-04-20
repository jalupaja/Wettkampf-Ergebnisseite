<script>
  import { onMount, onDestroy } from 'svelte';
  import { api } from '../../api.js';
  
  let groups = $state([]);
  let loading = $state(true);
  let error = $state('');
  
  let showModal = $state(false);
  let importing = $state(false);
  
  let formData = $state({
    name: '',
    description: '',
    order: null
  });
  
  let editingId = $state(null);
  
  onMount(async () => {
    window.addEventListener('close-modal', closeModal);
    await loadGroups();
  });

  onDestroy(() => {
    window.removeEventListener('close-modal', closeModal);
  });
  
  function handleExport() {
    window.open('/api/admin/data/groups', '_blank');
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
      await api.data.importGroups('append', data);
            await loadGroups();
    } catch (err) {
      error = err.message;
    }
    importing = false;
    event.target.value = '';
  }
  
  async function clearAllGroups() {
    if (!confirm('Wirklich alle Startklassen löschen? Athleten verlieren ihre Zuordnung!')) return;
    try {
      await api.data.importGroups('replace', []);
      await loadGroups();
    } catch (err) {
      error = err.message;
    }
  }
  
  async function loadGroups() {
    loading = true;
    error = '';
    try {
      const data = await api.groups.admin.list();
      groups = data.groups;
    } catch (err) {
      error = err.message;
    }
    loading = false;
  }
  
  function openModal(group = null) {
    if (group) {
      editingId = group.id;
      formData = {
        name: group.name,
        description: group.description || '',
        order: group.order
      };
    } else {
      editingId = null;
      const maxOrder = Math.max(...groups.map(g => g.order), 0);
      formData = {
        name: '',
        description: '',
        order: maxOrder + 1
      };
    }
    showModal = true;
  }
  
  function closeModal() {
    showModal = false;
    editingId = null;
  }
  
  async function handleSubmit() {
    error = '';
    try {
      const payload = { ...formData };
      if (!payload.order) delete payload.order;
      
      if (editingId) {
        await api.groups.admin.update(editingId, payload);
      } else {
        await api.groups.admin.create(payload);
      }
      
      closeModal();
      await loadGroups();
    } catch (err) {
      error = err.message;
    }
  }
  
  async function deleteGroup(id) {
    if (!confirm('Startklasse wirklich löschen? Athleten verlieren ihre Zuordnung.')) return;
    
    try {
      await api.groups.admin.delete(id);
      await loadGroups();
    } catch (err) {
      error = err.message;
    }
  }
  
  async function moveGroup(id, direction) {
    const index = groups.findIndex(g => g.id === id);
    if (index === -1) return;
    
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= groups.length) return;
    
    const group = groups[index];
    const neighbor = groups[newIndex];
    
    try {
      await api.groups.admin.update(id, { order: neighbor.order });
      await api.groups.admin.update(neighbor.id, { order: group.order });
      await loadGroups();
    } catch (err) {
      error = err.message;
    }
  }
</script>

<div class="groups-management">
  <div class="header">
    <h2>Startklassen-Verwaltung</h2>
    <div class="header-actions">
      <input type="file" accept=".csv" id="groups-import" onchange={handleImport} disabled={importing} class="hidden-input" />
      <label for="groups-import" class="outline btn-sm">{importing ? 'Importieren...' : 'Import'}</label>
      <button class="outline btn-sm" onclick={handleExport}>Export</button>
      <button class="danger btn-sm" onclick={clearAllGroups}>Alle löschen</button>
      <button class="primary" onclick={() => openModal()}>
        + Neue Startklasse
      </button>
    </div>
  </div>
  
  {#if error}
    <div class="error-message">{error}</div>
  {/if}
  
  {#if loading}
    <div class="loading">Laden...</div>
  {:else}
    <div class="groups-list">
      {#each groups as group, index}
        <div class="group-card card">
          <div class="group-info">
            <div class="group-order">{group.order}</div>
            <div class="group-details">
              <h3>{group.name}</h3>
              {#if group.description}
                <p class="description">{group.description}</p>
              {/if}
            </div>
          </div>
          <div class="group-actions">
            <button 
              class="outline btn-sm" 
              onclick={() => moveGroup(group.id, 'up')}
              disabled={index === 0}
            >
              ↑
            </button>
            <button 
              class="outline btn-sm" 
              onclick={() => moveGroup(group.id, 'down')}
              disabled={index === groups.length - 1}
            >
              ↓
            </button>
            <button class="outline btn-sm" onclick={() => openModal(group)}>
              Bearbeiten
            </button>
            <button class="danger btn-sm" onclick={() => deleteGroup(group.id)}>
              Löschen
            </button>
          </div>
        </div>
      {/each}
      
      {#if !groups.length}
        <div class="empty-state card">
          <p>Keine Startklassen vorhanden.</p>
        </div>
      {/if}
    </div>
  {/if}
  
  {#if showModal}
    <div class="modal-overlay" role="dialog" aria-modal="true" onclick={closeModal} onkeydown={(e) => e.key === 'Escape' && closeModal()} tabindex="-1" aria-label="Dialog">
      <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
      <div class="modal" role="document" onclick={(e) => e.stopPropagation()} onkeydown={(e) => e.stopPropagation()}>
        <h3>{editingId ? 'Startklasse bearbeiten' : 'Neue Startklasse'}</h3>
        
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
              placeholder="z.B. Herren, Damen, Jugend m"
              required
            />
          </div>
          
          <div class="form-group">
            <label for="description">Beschreibung (optional)</label>
            <input
              type="text"
              id="description"
              bind:value={formData.description}
              placeholder="z.B. Männer allgemein"
            />
          </div>
          
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
  .groups-management {
    max-width: 800px;
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
  
  .groups-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  
  .group-card {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .group-info {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  
  .group-order {
    width: 40px;
    height: 40px;
    background: var(--color-bg-lighter);
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    color: var(--color-text-muted);
  }
  
  .group-details h3 {
    font-size: 16px;
    margin-bottom: 2px;
  }
  
  .description {
    font-size: 13px;
    color: var(--color-text-muted);
  }
  
  .group-actions {
    display: flex;
    gap: 8px;
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
    max-width: 450px;
    border: 1px solid var(--color-border);
  }
  
  .modal h3 {
    margin-bottom: 24px;
    font-size: 20px;
  }
  
  .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 24px;
  }
</style>
