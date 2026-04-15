<script>
  import { onMount, onDestroy } from 'svelte';
  import { api } from '../api.js';
  import { userStore } from '../stores/user.js';
  import RoutesView from './RoutesView.svelte';
  import ResultsView from './ResultsView.svelte';
  
  let activeTab = $state('routes');
  let user = $state(null);
  
  userStore.subscribe(value => {
    user = value;
  });
</script>

<div class="athlete-dashboard">
  <div class="tabs">
    <button 
      class:active={activeTab === 'routes'} 
      onclick={() => activeTab = 'routes'}
    >
      Routen
    </button>
    <button 
      class:active={activeTab === 'results'} 
      onclick={() => activeTab = 'results'}
    >
      Rangliste
    </button>
  </div>
  
  <div class="tab-content">
    {#if activeTab === 'routes'}
      <RoutesView />
    {:else}
      <ResultsView />
    {/if}
  </div>
</div>

<style>
  .athlete-dashboard {
    margin-top: 20px;
  }
  
  .tabs {
    display: flex;
    gap: 8px;
    margin-bottom: 24px;
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
