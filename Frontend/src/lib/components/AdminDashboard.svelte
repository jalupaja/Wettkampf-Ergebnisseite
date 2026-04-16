<script>
  import { onMount } from 'svelte';
  import UsersManagement from './admin/UsersManagement.svelte';
  import GroupsManagement from './admin/GroupsManagement.svelte';
  import RoutesManagement from './admin/RoutesManagement.svelte';
  import ConfigManagement from './admin/ConfigManagement.svelte';
  import ResultsView from './ResultsView.svelte';
  import FinaleControl from './admin/FinaleControl.svelte';
  
  let activeTab = $state('users');
  
  const tabs = [
    { id: 'users', label: 'Benutzer' },
    { id: 'groups', label: 'Startklassen' },
    { id: 'routes', label: 'Routen' },
    { id: 'config', label: 'Einstellungen' },
    { id: 'results', label: 'Rangliste' },
    { id: 'status', label: 'Status' }
  ];
</script>

<div class="admin-dashboard">
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
