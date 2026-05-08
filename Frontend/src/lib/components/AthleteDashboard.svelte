<script>
  import { onMount, onDestroy } from 'svelte';
  import { api } from '../api.js';
  import { userStore } from '../stores/user.js';
  import RoutesView from './RoutesView.svelte';
  import AthleteResultsView from './AthleteResultsView.svelte';
  
  // Show rankings by default for athletes so they see the current standings immediately after login
  let activeTab = $state('results');
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
      <AthleteResultsView />
    {/if}
  </div>
</div>

<style>
  .athlete-dashboard {
    margin-top: 16px;
  }
  
  .tabs {
    display: flex;
    gap: 8px;
    margin-bottom: 20px;
  }
  
  .tabs button {
    background: var(--color-bg-light);
    border: 1px solid var(--color-border);
    padding: 10px 20px;
    color: var(--color-text);
    font-weight: 500;
    font-size: 14px;
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
  
  @media (max-width: 480px) {
    .tabs button {
      padding: 10px 16px;
      font-size: 13px;
    }
  }
</style>
