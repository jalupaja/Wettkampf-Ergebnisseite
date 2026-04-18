<script>
  import { onMount } from 'svelte';
  import { userStore } from '../stores/user.js';
  import UsersManagement from './admin/UsersManagement.svelte';
  import GroupsManagement from './admin/GroupsManagement.svelte';
  import RoutesManagement from './admin/RoutesManagement.svelte';
  import ConfigManagement from './admin/ConfigManagement.svelte';
  import AdminResultsView from './AdminResultsView.svelte';
  import FinaleControl from './admin/FinaleControl.svelte';
  
  let activeTab = $state('results');
  
  const tabs = [
    { id: 'results', label: 'Rangliste' },
    { id: 'users', label: 'Benutzer' },
    { id: 'groups', label: 'Startklassen' },
    { id: 'routes', label: 'Routen' },
    { id: 'config', label: 'Einstellungen' },
    { id: 'status', label: 'Status' }
  ];
  
  const showPasswordWarning = $derived($userStore?.needsPasswordChange === true);
  
  function goToUsers() {
    activeTab = 'users';
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
