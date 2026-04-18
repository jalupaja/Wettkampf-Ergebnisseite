<script>
  import { onMount } from 'svelte';
  import { userStore } from './lib/stores/user.js';
  import { themeStore } from './lib/stores/theme.js';
  import { api } from './lib/api.js';
  import Login from './lib/components/Login.svelte';
  import Dashboard from './lib/components/Dashboard.svelte';
  import Header from './lib/components/Header.svelte';
  import ResultsView from './lib/components/ResultsView.svelte';
  import './lib/styles/global.css';
  
  let loading = $state(true);
  let isDark = $state(true);
  let showLogin = $state(false);
  
  function openLogin() { showLogin = true; }
  function closeLogin() { showLogin = false; }
  
  function handleKeydown(e) {
    if (e.key === 'Escape') {
      closeLogin();
      window.dispatchEvent(new CustomEvent('close-modal'));
    }
  }
  
  onMount(async () => {
    window.addEventListener('open-login', openLogin);
    window.addEventListener('keydown', handleKeydown);
    
    themeStore.subscribe(value => {
      isDark = value;
      if (typeof document !== 'undefined') {
        document.body.classList.toggle('dark', value);
        document.body.classList.toggle('light', !value);
      }
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

<div class:dark={isDark} class:light={!isDark}>
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
    <ResultsView onLogin={openLogin} />
  {/if}
  
  {#if showLogin}
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
    <div class="modal-overlay" role="dialog" tabindex="-1" onclick={closeLogin} onkeydown={(e) => e.key === 'Escape' && closeLogin()}>
      <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_noninteractive_element_interactions -->
      <div class="modal" onclick={(e) => e.stopPropagation()}>
        <Login onLogin={closeLogin} />
      </div>
    </div>
  {/if}
</div>

<style>
  div {
    min-height: 100vh;
    max-width: 100vw;
    overflow-x: hidden;
  }
  
  main {
    padding: 16px;
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
    max-width: 400px;
    width: 90%;
  }
  
  @media (max-width: 640px) {
    main { padding: 12px; }
  }
</style>
