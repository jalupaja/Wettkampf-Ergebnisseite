<script>
  import { onMount } from 'svelte';
  import { api } from '../../api.js';
  
  let users = $state([]);
  let groups = $state([]);
  let loading = $state(true);
  let error = $state('');
  let showModal = $state(false);
  
  let formData = $state({
    username: '',
    password: '',
    role: 'athlete',
    groupId: ''
  });
  
  let editingId = $state(null);
  
  onMount(async () => {
    await loadData();
  });
  
  async function loadData() {
    loading = true;
    error = '';
    try {
      const [usersData, groupsData] = await Promise.all([
        api.users.list(),
        api.groups.admin.list()
      ]);
      users = usersData.users;
      groups = groupsData.groups;
    } catch (err) {
      error = err.message;
    }
    loading = false;
  }
  
  function openModal(user = null) {
    if (user) {
      editingId = user.id;
      formData = {
        username: user.username,
        password: '',
        role: user.role,
        groupId: user.groupId || ''
      };
    } else {
      editingId = null;
      formData = {
        username: '',
        password: '',
        role: 'athlete',
        groupId: groups.length ? groups[0].id : ''
      };
    }
    showModal = true;
  }
  
  function closeModal() {
    showModal = false;
    editingId = null;
    formData = { username: '', password: '', role: 'athlete', groupId: '' };
  }
  
  async function handleSubmit() {
    error = '';
    try {
      const payload = { ...formData };
      if (!payload.password) delete payload.password;
      if (payload.role === 'admin') delete payload.groupId;
      
      if (editingId) {
        await api.users.update(editingId, payload);
      } else {
        await api.users.create(payload);
      }
      
      await loadData();
      closeModal();
    } catch (err) {
      error = err.message;
    }
  }
  
  async function deleteUser(id) {
    if (!confirm('Benutzer wirklich löschen?')) return;
    
    try {
      await api.users.delete(id);
      await loadData();
    } catch (err) {
      error = err.message;
    }
  }
</script>

<div class="users-management">
  <div class="header">
    <h2>Benutzerverwaltung</h2>
    <button class="primary" onclick={() => openModal()}>
      + Neuer Benutzer
    </button>
  </div>
  
  {#if error}
    <div class="error-message">{error}</div>
  {/if}
  
  {#if loading}
    <div class="loading">Laden...</div>
  {:else}
    <div class="card">
      <table class="data-table">
        <thead>
          <tr>
            <th>Benutzername</th>
            <th>Rolle</th>
            <th>Startklasse</th>
            <th>Aktionen</th>
          </tr>
        </thead>
        <tbody>
          {#each users as user}
            <tr>
              <td class="username">{user.username}</td>
              <td>
                <span class="badge" class:admin={user.role === 'admin'}>
                  {user.role === 'admin' ? 'Admin' : 'Athlet'}
                </span>
              </td>
              <td>{user.groupName || '-'}</td>
              <td class="actions">
                <button class="outline btn-sm" onclick={() => openModal(user)}>
                  Bearbeiten
                </button>
                {#if user.role !== 'admin'}
                  <button class="danger btn-sm" onclick={() => deleteUser(user.id)}>
                    Löschen
                  </button>
                {/if}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
  
  {#if showModal}
    <div class="modal-overlay" onclick={closeModal}>
      <div class="modal" onclick={(e) => e.stopPropagation()}>
        <h3>{editingId ? 'Benutzer bearbeiten' : 'Neuer Benutzer'}</h3>
        
        <form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
          {#if error}
            <div class="error-message">{error}</div>
          {/if}
          
          <div class="form-group">
            <label for="username">Benutzername</label>
            <input
              type="text"
              id="username"
              bind:value={formData.username}
              required
              disabled={!!editingId}
            />
          </div>
          
          <div class="form-group">
            <label for="password">
              Passwort {editingId ? '(leer lassen zum Beibehalten)' : ''}
            </label>
            <input
              type="password"
              id="password"
              bind:value={formData.password}
              required={!editingId}
            />
          </div>
          
          <div class="form-group">
            <label for="role">Rolle</label>
            <select id="role" bind:value={formData.role}>
              <option value="athlete">Athlet</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          
          {#if formData.role === 'athlete'}
            <div class="form-group">
              <label for="groupId">Startklasse</label>
              <select id="groupId" bind:value={formData.groupId}>
                {#each groups as group}
                  <option value={group.id}>{group.name}</option>
                {/each}
              </select>
            </div>
          {/if}
          
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
  .users-management {
    max-width: 1000px;
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
  
  .data-table {
    width: 100%;
    border-collapse: collapse;
  }
  
  .data-table th,
  .data-table td {
    padding: 12px;
    text-align: left;
    border-bottom: 1px solid var(--color-border);
  }
  
  .data-table th {
    font-size: 12px;
    text-transform: uppercase;
    color: var(--color-text-muted);
    font-weight: 600;
  }
  
  .data-table tr:last-child td {
    border-bottom: none;
  }
  
  .username {
    font-weight: 500;
  }
  
  .badge {
    background: var(--color-secondary);
    color: white;
    padding: 4px 10px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 600;
  }
  
  .badge.admin {
    background: var(--color-primary);
  }
  
  .actions {
    display: flex;
    gap: 8px;
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
