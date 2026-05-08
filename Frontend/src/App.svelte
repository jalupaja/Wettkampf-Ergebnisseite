<script>
  import { onMount } from 'svelte';
  import { userStore } from './lib/stores/user.js';
  import { themeStore } from './lib/stores/theme.js';
  import { api } from './lib/api.js';
  import Login from './lib/components/Login.svelte';
  import Dashboard from './lib/components/Dashboard.svelte';
  import Header from './lib/components/Header.svelte';
  import ResultsView from './lib/components/ResultsView.svelte';
  import RankingsAuto from './lib/components/RankingsAuto.svelte';
  import Toast from './lib/components/Toast.svelte';
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
    // Ensure Escape closes modal by handling keydown at window level
    window.addEventListener('keydown', handleKeydown);
    
    themeStore.subscribe(value => {
      isDark = value;
      if (typeof document !== 'undefined') {
        document.body.classList.toggle('dark', value);
        document.body.classList.toggle('light', !value);
      }
    });
    
    try {
      // Debug: print API, origin, and cookie names to help diagnose auth/CORS issues
      try {
        // eslint-disable-next-line no-console
        console.info('[wettkampf-debug] API_BASE=', api && api ? undefined : '');
        // Print API_BASE computed by the client library
        // We import api above; its module prints API_BASE on import. Also print window location and cookie names.
        if (typeof window !== 'undefined') {
          // eslint-disable-next-line no-console
          console.info('[wettkampf-debug] window.location=', window.location.href);
          // Do not print cookie values, only names
          const cookieNames = document.cookie.split(';').map(c => c.split('=')[0].trim()).filter(Boolean);
          // eslint-disable-next-line no-console
          console.info('[wettkampf-debug] cookie names=', cookieNames);
        }
      } catch (e) {
        // ignore debug helper errors
      }
      const data = await api.auth.check();
      if (data.authenticated) {
        userStore.login(data.user);
      }
    } catch (e) {
      console.log('Not authenticated');
    }
    // detect direct access to the auto rankings page
    try {
      const path = typeof window !== 'undefined' ? window.location.pathname : '';
      if (path && path.replace(/\/$/, '') === '/rankings_auto') {
        // Show RankingsAuto page only
        // Replace body content by rendering RankingsAuto component (handled below)
        // We set loading=false and rely on the conditional rendering below
        loading = false;
        // set a global flag on window so the markup shows RankingsAuto
        window.__SHOW_RANKINGS_AUTO = true;
      }
    } catch (e) {
      // ignore
    }
    loading = false;
  });

  // Overlay handlers (silenced) - prefer pointerdown on backdrop and stopPropagation inside modal
  function overlayHandler(e) {
    // Close only when the backdrop itself was hit
    if (e.target === e.currentTarget) {
      closeLogin();
    }
  }

  function stopHandler(e) {
    // Prevent clicks inside the modal from reaching the backdrop
    e.stopPropagation();
  }

  let overlayEl;

  // When the modal opens, focus the backdrop so keyboard events (Escape) are reliably received
  $effect(() => {
    if (showLogin) {
      requestAnimationFrame(() => overlayEl?.focus());
    }
  });
</script>

<div class:dark={isDark} class:light={!isDark}>
  <Toast />
  {#if typeof window !== 'undefined' && window.__SHOW_RANKINGS_AUTO}
    <RankingsAuto />
  {:else if loading}
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
    <!-- modal overlay: clicking/touching outside closes the modal. Use Svelte event modifiers
         to ensure only clicks/touches directly on the overlay (not its children) close the modal.
         Also listen for Escape key. -->
  <div
    bind:this={overlayEl}
    class="modal-overlay"
    role="presentation"
    tabindex="0"
    onclick={overlayHandler}
    onpointerdown={overlayHandler}
    onkeydown={(e) => {
      const key = e.key || e.code;
      if (key === 'Escape') closeLogin();
    }}
  >
      <!-- inner modal: the dialog itself - interactive role so tabindex and events are acceptable -->
    <div
      class="modal"
      role="dialog"
      aria-modal="true"
      tabindex="0"
      onkeydown={stopHandler}
    >
      <Login
        onLogin={closeLogin}
        embedded={true}
        onclick={stopHandler}
        onpointerdown={stopHandler}
        onpointerup={stopHandler}
        ontouchstart={stopHandler}
        ontouchend={stopHandler}
      />
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
  /* Raise overlay above toasts/timers which use z-index: 9999 */
  z-index: 10001;
  pointer-events: auto; /* ensure overlay can receive tap events */
}
  
  .modal {
    /* Keep the modal wrapper simple and shrink-wrapped to its content so
       it does NOT stretch to the full overlay size. This ensures clicks
       outside the popup hit the overlay element instead of the modal.
    */
    display: inline-block;
    align-self: center;
    position: relative;
    padding: 0;
    background: transparent;
    width: auto;
    max-width: none;
  }

  /* Constrain modal height and let inner card scroll when necessary */
  .modal {
    max-height: 90vh;
    overflow: auto;
  }

  /* Target the login card inside the modal so it remains compact */
  :global(.modal .login-card) {
    max-height: 80vh;
    overflow: auto;
    margin: 0 auto;
    box-shadow: 0 8px 32px rgba(0,0,0,0.12);
  }

  /* Removed unused .modal-close styles (close button now lives inside
     the embedded login card as .embedded-close). */
  
  @media (max-width: 640px) {
    main { padding: 12px; }
  }
</style>
