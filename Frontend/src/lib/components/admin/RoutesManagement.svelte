<script>
  import { onMount } from 'svelte';
  import { api } from '../../api.js';
  
  let routes = $state([]);
  let loading = $state(true);
  let error = $state('');
  let showModal = $state(false);
  
  let formData = $state({
    name: '',
    category: 'qualification',
    points: 100,
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
        points: route.points,
        order: route.order
      };
    } else {
      editingId = null;
      const maxOrder = Math.max(...routes.map(r => r.order), 0);
      formData = {
        name: '',
        category: 'qualification',
        points: 100,
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
    <button class="primary" onclick={() => openModal()}>
      + Neue Route
    </button>
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
                <span class="route-points">{route.points} Punkte</span>
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
                <span class="route-points">{route.points} Punkte</span>
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
                <span class="route-points">{route.points} Punkte</span>
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
    <div class="modal-overlay" role="dialog" aria-modal="true" onclick={closeModal} onkeydown={(e) => e.key === 'Escape' && closeModal()} tabindex="-1">
      <div class="modal" role="document" onclick={(e) => e.stopPropagation()}>
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
            <label for="points">Punkte</label>
            <input
              type="number"
              id="points"
              bind:value={formData.points}
              min="1"
              required
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
  
  .route-points {
    font-size: 13px;
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
