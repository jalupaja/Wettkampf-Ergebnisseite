<script>
  import { onMount } from 'svelte';
  import { userStore } from './lib/stores/user.js';
  import { themeStore } from './lib/stores/theme.js';
  import { api } from './lib/api.js';
  import Login from './lib/components/Login.svelte';
  import Dashboard from './lib/components/Dashboard.svelte';
  import Header from './lib/components/Header.svelte';
  import './lib/styles/global.css';
  
  let loading = $state(true);
  let theme = $state(true);
  
  onMount(async () => {
    themeStore.subscribe(value => {
      theme = value;
    });
    
    try {
      const data = await api.auth.check();
      if (data.authenticated) {
        userStore.login(data.user);
      }
    } catch (e) {
      console.log('Not authenticated');
    }
    loading = false;
  });
</script>

<div class:dark={theme} class:light={!theme}>
  {#if loading}
    <div class="loading">
      <div class="spinner"></div>
      <p>Laden...</p>
    </div>
  {:else if $userStore}
    <Header />
    <main>
      <Dashboard />
    </main>
  {:else}
    <Login />
  {/if}
</div>

<style>
  div {
    min-height: 100vh;
  }
  
  main {
    padding: 20px;
    max-width: 1400px;
    margin: 0 auto;
  }
  
  .loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    gap: 16px;
  }
  
  .spinner {
    width: 40px;
    height: 40px;
    border: 4px solid var(--color-border);
    border-top-color: var(--color-primary);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
</style>
