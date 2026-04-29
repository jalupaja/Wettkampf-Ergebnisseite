<script>
  import { onMount } from 'svelte';
  import { api } from '../api.js';
  import { userStore } from '../stores/user.js';
  import { toastStore } from '../stores/toast.js';
  import UsersManagement from './admin/UsersManagement.svelte';
  import GroupsManagement from './admin/GroupsManagement.svelte';
  import RoutesManagement from './admin/RoutesManagement.svelte';
  import ConfigManagement from './admin/ConfigManagement.svelte';
  import AdminResultsView from './AdminResultsView.svelte';
  import FinaleControl from './admin/FinaleControl.svelte';
  import RoutesView from './RoutesView.svelte';
  
  let activeTab = $state('results');
  let users = $state([]);
  let selectedUserId = $state('');
  let loadingUsers = $state(true);
  const isErgebnisdienst = $derived($userStore?.role === 'ergebnisdienst');
  
  const tabs = $derived(
    isErgebnisdienst
      ? [
          { id: 'results', label: 'Rangliste' },
          { id: 'entry', label: 'Ergebniseingabe' }
        ]
      : [
          { id: 'results', label: 'Rangliste' },
          { id: 'entry', label: 'Ergebniseingabe' },
          { id: 'users', label: 'Benutzer' },
          { id: 'groups', label: 'Startklassen' },
          { id: 'routes', label: 'Routen' },
          { id: 'config', label: 'Einstellungen' },
          { id: 'status', label: 'Status' }
        ]
  );
  
  const showPasswordWarning = $derived($userStore?.needsPasswordChange === true);
  const selectedUser = $derived(users.find(user => user.id === selectedUserId) || $userStore || null);
  
  function goToUsers() {
    activeTab = 'users';
  }
  
  onMount(async () => {
    selectedUserId = $userStore?.id || '';
    await loadUsers();
  });

  $effect(() => {
    if (activeTab === 'entry' || activeTab === 'results') {
      loadUsers();
    }
  });

  async function onUserChange(e) {
    selectedUserId = e.target.value;
    await loadUsers();
  }
  
  async function loadUsers() {
    loadingUsers = true;
    try {
      const data = await api.users.list();
      let filtered = data.users.filter(user => ['athlete', 'finalist'].includes(user.role));
      
      filtered.sort((a, b) => {
        if (a.role === 'finalist' && b.role !== 'finalist') return -1;
        if (a.role !== 'finalist' && b.role === 'finalist') return 1;
        return a.username.localeCompare(b.username, 'de');
      });
      
      users = filtered;
      if (users.length && !users.some(user => user.id === selectedUserId)) {
        selectedUserId = users[0].id;
      }

      if (!users.length) {
        selectedUserId = '';
      }
    } catch (err) {
      toastStore.error(err.message);
    }
    loadingUsers = false;
  }
</script>

<div class="admin-dashboard">
  {#if showPasswordWarning}
    <div class="warning-banner">
      <span>⚠️ Standardpasswort erkannt!</span>
      <span>Bitte ändern Sie das Admin-Passwort unter <button class="link-btn" onclick={goToUsers}>Benutzer</button></span>
    </div>
  {/if}
  
  <div class="tabs">
    {#each tabs as tab}
      <button 
        class:active={activeTab === tab.id} 
        onclick={() => activeTab = tab.id}
      >
        {tab.label}
      </button>
    {/each}
  </div>
  
  <div class="tab-content">
    {#if activeTab === 'users'}
      <UsersManagement />
    {:else if activeTab === 'groups'}
      <GroupsManagement />
    {:else if activeTab === 'routes'}
      <RoutesManagement />
    {:else if activeTab === 'config'}
      <ConfigManagement />
    {:else if activeTab === 'results'}
      <AdminResultsView />
    {:else if activeTab === 'entry'}
      <div class="route-entry-panel">
        <div class="route-entry-toolbar">
          <label for="route-target-user">Benutzer</label>
          <select id="route-target-user" bind:value={selectedUserId} onchange={onUserChange} disabled={loadingUsers || users.length === 0}>
            {#each users as user}
              <option value={user.id}>{user.username} ({user.role})</option>
            {/each}
          </select>
        </div>
        
        {#if loadingUsers}
          <div class="loading">Laden...</div>
        {:else if selectedUser}
          {#key selectedUser.id}
            <RoutesView targetUser={selectedUser} />
          {/key}
        {/if}
      </div>
    {:else if activeTab === 'status'}
      <FinaleControl />
    {/if}
  </div>
</div>

<style>
  .admin-dashboard {
    margin-top: 16px;
  }
  
  .warning-banner {
    background: rgba(243, 156, 18, 0.15);
    border: 1px solid var(--color-zone);
    color: var(--color-zone);
    padding: 12px 16px;
    border-radius: 8px;
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 500;
    flex-wrap: wrap;
  }
  
  .warning-banner span:first-child {
    font-size: 16px;
  }
  
  .link-btn {
    background: none;
    border: none;
    padding: 0;
    color: var(--color-primary);
    text-decoration: underline;
    cursor: pointer;
    font-size: inherit;
    font-weight: inherit;
  }
  
  .link-btn:hover {
    opacity: 0.8;
  }
  
  .tabs {
    display: flex;
    gap: 6px;
    margin-bottom: 20px;
    flex-wrap: wrap;
    overflow-x: auto;
    padding-bottom: 4px;
  }
  
  .tabs button {
    background: var(--color-bg-light);
    border: 1px solid var(--color-border);
    padding: 10px 16px;
    color: var(--color-text);
    font-weight: 500;
    font-size: 13px;
    white-space: nowrap;
  }
  
  .tabs button.active {
    background: var(--color-primary);
    border-color: var(--color-primary);
    color: var(--color-white);
  }
  
  .tab-content {
    animation: fadeIn 0.2s ease;
  }
  
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  .route-entry-panel {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  
  .route-entry-toolbar {
    display: flex;
    flex-direction: column;
    gap: 8px;
    max-width: 360px;
  }
  
  .error-message {
    background: rgba(231, 76, 60, 0.1);
    border: 1px solid var(--color-error);
    color: var(--color-error);
    padding: 12px;
    border-radius: 8px;
  }
  
  .loading {
    text-align: center;
    padding: 24px;
    color: var(--color-text-muted);
  }
  
  @media (max-width: 640px) {
    .tabs button {
      padding: 8px 12px;
      font-size: 12px;
    }
    
    .warning-banner {
      font-size: 13px;
    }
  }
</style>
