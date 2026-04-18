<script>
  import { onMount, onDestroy } from 'svelte';
  import { api } from '../../api.js';
  import { userStore } from '../../stores/user.js';
  
  let users = $state([]);
  let groups = $state([]);
  let loading = $state(true);
  let error = $state('');
  
  let showModal = $state(false);
  let generatedPassword = $state('');
  let searchQuery = $state('');
  let importing = $state(false);
  
  let formData = $state({
    username: '',
    password: '',
    role: 'athlete',
    groupId: ''
  });
  
  let editingId = $state(null);
  
  const filteredUsers = $derived(
    searchQuery.trim() === ''
      ? users
      : users.filter(u => 
          u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (u.groupName && u.groupName.toLowerCase().includes(searchQuery.toLowerCase()))
        )
  );
  
  function generatePassword() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
  
  onMount(async () => {
    window.addEventListener('close-modal', closeModal);
    
    await loadData();
  });
  
  function handleExport() {
    window.open('/api/admin/data/users', '_blank');
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
      const result = await api.data.importUsers('append', data);
      await loadData();
      
      const generatedPasswords = result.results?.filter(r => r.password).map(r => `${r.username}: ${r.password}`).join('\n');
      if (generatedPasswords) {
        alert(`Import erfolgreich!\n\nGenerierte Passwörter:\n${generatedPasswords}`);
      } else {
        alert(`Import erfolgreich!`);
      await loadData();
      }
    } catch (err) {
      error = err.message;
    }
    importing = false;
    event.target.value = '';
  }
  
  async function clearAllUsers() {
    if (!confirm('Wirklich alle Benutzer löschen? Admins bleiben erhalten.')) return;
    try {
      await api.data.importUsers('replace', []);
      await loadData();
    } catch (err) {
      error = err.message;
    }
  }
  
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
        password: user.password || '',
        role: user.role,
        groupId: user.groupId || ''
      };
      generatedPassword = user.password || '';
    } else {
      editingId = null;
      generatedPassword = generatePassword();
      formData = {
        username: '',
        password: generatedPassword,
        role: 'athlete',
        groupId: groups.length ? groups[0].id : ''
      };
    }
    showModal = true;
  }
  
  function closeModal() {
    showModal = false;
    editingId = null;
    generatedPassword = '';
    formData = { username: '', password: '', role: 'athlete', groupId: '' };
  }
  
  function handlePasswordGenerate() {
    generatedPassword = generatePassword();
    formData.password = generatedPassword;
  }
  
  async function handleSubmit() {
    error = '';
    try {
      const payload = { ...formData };
      if (!payload.password) delete payload.password;
      if (payload.role === 'admin') delete payload.groupId;
      
      if (editingId) {
        await api.users.update(editingId, payload);
        if (payload.password && editingId === $userStore?.id) {
          userStore.updatePasswordChanged();
        }
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
    <div class="header-actions">
      <input type="file" accept=".csv" id="users-import" onchange={handleImport} disabled={importing} class="hidden-input" />
      <label for="users-import" class="outline btn-sm">{importing ? 'Importieren...' : 'Import'}</label>
      <button class="outline btn-sm" onclick={handleExport}>Export</button>
      <button class="danger btn-sm" onclick={clearAllUsers}>Alle löschen</button>
      <button class="primary" onclick={() => openModal()}>
        + Neuer Athlet
      </button>
    </div>
  </div>
  
  {#if error}
    <div class="error-message">{error}</div>
  {/if}
  
  {#if loading}
    <div class="loading">Laden...</div>
  {:else}
    <div class="search-bar">
      <input 
        type="text" 
        placeholder="Suchen..." 
        bind:value={searchQuery}
      />
      {#if searchQuery}
        <span class="search-count">{filteredUsers.length} von {users.length}</span>
      {/if}
    </div>
    
    <div class="card">
      <table class="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Passwort</th>
            <th>Startklasse</th>
            <th>Aktionen</th>
          </tr>
        </thead>
        <tbody>
          {#each filteredUsers as user}
            <tr class:admin-row={user.role === 'admin'}>
              <td>
                <span class="username-text">{user.username}</span>
                {#if user.role === 'admin'}
                  <span class="badge admin">Admin</span>
                {/if}
              </td>
              <td class="password">
                {#if user.password}
                  <code>{user.password}</code>
                {:else}
                  <span class="muted">-</span>
                {/if}
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
    <div class="modal-overlay" role="dialog" aria-modal="true" onclick={closeModal} onkeydown={(e) => e.key === 'Escape' && closeModal()} tabindex="-1" aria-label="Dialog">
      <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
      <div class="modal" role="document" onclick={(e) => e.stopPropagation()} onkeydown={(e) => e.stopPropagation()}>
        <h3>{editingId ? 'Athlet bearbeiten' : 'Neuer Athlet'}</h3>
        
        <form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
          {#if error}
            <div class="error-message">{error}</div>
          {/if}
          
          <div class="form-group">
            <label for="username">Name</label>
            <input
              type="text"
              id="username"
              bind:value={formData.username}
              placeholder="z.B. Max Mustermann"
              required
              disabled={!!editingId}
            />
          </div>
          
          <div class="form-group">
            <label for="password">Passwort</label>
            <div class="password-input-group">
              <input
                type="text"
                id="password"
                bind:value={formData.password}
                placeholder="Passwort eingeben oder generieren"
                required={!editingId}
              />
              <button type="button" class="outline" onclick={handlePasswordGenerate}>
                Generieren
              </button>
            </div>
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
  
  .search-bar {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
  }
  
  .search-bar input {
    max-width: 300px;
  }
  
  .search-count {
    font-size: 14px;
    color: var(--color-text-muted);
  }
  
  .data-table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
  }
  
  .data-table th,
  .data-table td {
    padding: 12px;
    text-align: left;
    border-bottom: 1px solid var(--color-border);
    vertical-align: middle;
  }
  
  .data-table th:first-child,
  .data-table td:first-child {
    width: auto;
  }
  
  .data-table th:last-child,
  .data-table td:last-child {
    width: 180px;
    text-align: right;
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
  
  .admin-row {
    opacity: 0.7;
  }
  
  .username-text {
    font-weight: 500;
    margin-right: 8px;
  }
  
  .badge {
    background: var(--color-secondary);
    color: var(--color-white);
    padding: 4px 10px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 600;
  }
  
  .badge.admin {
    background: var(--color-primary);
  }
  
  .password code {
    background: var(--color-bg-lighter);
    padding: 4px 8px;
    border-radius: 4px;
    font-family: monospace;
    font-size: 14px;
    letter-spacing: 1px;
  }
  
  .muted {
    color: var(--color-text-muted);
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
  
  .password-input-group {
    display: flex;
    gap: 8px;
  }
  
  .password-input-group input {
    flex: 1;
  }
  
  .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 24px;
  }
</style>
