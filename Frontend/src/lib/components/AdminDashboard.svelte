<script>
  import { onMount } from 'svelte';
  import { userStore } from '../stores/user.js';
  import UsersManagement from './admin/UsersManagement.svelte';
  import GroupsManagement from './admin/GroupsManagement.svelte';
  import RoutesManagement from './admin/RoutesManagement.svelte';
  import ConfigManagement from './admin/ConfigManagement.svelte';
  import ResultsView from './ResultsView.svelte';
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
  
  const showPasswordWarning = $derived($userStore?.username === 'admin');
  
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
      <ResultsView admin={true} />
    {:else if activeTab === 'status'}
      <FinaleControl />
    {/if}
  </div>
</div>

<style>
  .admin-dashboard {
    margin-top: 20px;
  }
  
  .warning-banner {
    background: rgba(243, 156, 18, 0.15);
    border: 1px solid #f39c12;
    color: #f39c12;
    padding: 12px 16px;
    border-radius: 8px;
    margin-bottom: 20px;
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 500;
  }
  
  .warning-banner span:first-child {
    font-size: 18px;
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
    gap: 8px;
    margin-bottom: 24px;
    flex-wrap: wrap;
  }
  
  .tabs button {
    background: var(--color-bg-light);
    border: 1px solid var(--color-border);
    padding: 12px 24px;
    color: var(--color-text);
    font-weight: 500;
  }
  
  .tabs button.active {
    background: var(--color-primary);
    border-color: var(--color-primary);
    color: white;
  }
  
  .tab-content {
    animation: fadeIn 0.2s ease;
  }
  
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
</style>
