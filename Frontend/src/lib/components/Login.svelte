<script>
  import { api } from '../api.js';
  import { userStore } from '../stores/user.js';
  import { toastStore } from '../stores/toast.js';
  import { onMount } from 'svelte';
  
  let { onLogin, embedded = false } = $props();
  
  let password = $state('');
  let error = $state('');
  let loading = $state(false);
  let passwordInput;
  
  onMount(() => {
    requestAnimationFrame(() => passwordInput?.focus());
  });
  
  async function handleLogin(e) {
    e.preventDefault();
    error = '';
    loading = true;
    
    try {
      const data = await api.auth.login(password.toUpperCase());
      userStore.login(data.user);
      if (onLogin) onLogin();
    } catch (err) {
      error = err.message;
      toastStore.error(err.message);
    }
    loading = false;
  }
</script>

  <div class="login-card">
      {#if embedded}
      <button class="embedded-close" aria-label="Schließen" onclick={() => { if (onLogin) onLogin(); }}>
        ×
      </button>
    {/if}
    <div class="logo">
      <img src="/favicon.svg" alt="Wettkampf Logo" class="logo-img" />
      <h1>Offene Regensburger Stadtmeisterschaft</h1>
      <p>Kletterzentrum Lappersdorf</p>
    </div>
    
    <form onsubmit={handleLogin}>
      {#if error}
        <div class="error-message">{error}</div>
      {/if}
      <div class="form-group">
        <label for="password">Passwort</label>
        <input
          type="password"
          id="password"
          bind:this={passwordInput}
          bind:value={password}
          placeholder="Passwort eingeben"
          required
          disabled={loading}
        />
      </div>
      
      <button type="submit" class="primary btn-lg" disabled={loading}>
        {loading ? 'Anmelden...' : 'Anmelden'}
      </button>
    </form>
  </div>

<style>
  .login-card {
    background: var(--color-bg-light);
    border-radius: 16px;
    padding: 32px 24px;
    width: 100%;
    max-width: 360px;
    border: 1px solid var(--color-border);
    position: relative;
  }

  .embedded-close {
    position: absolute;
    top: 8px;
    right: 8px;
    border: none;
    background: transparent;
    font-size: 20px;
    cursor: pointer;
    color: var(--color-text-muted);
    line-height: 1;
    padding: 6px;
  }

  /* Ensure the embedded close button sits visibly on top of the card */
  .embedded-close {
    z-index: 2;
  }

  .logo {
    text-align: center;
    margin-bottom: 28px;
  }

  .logo-img {
    height: 48px;
    width: 48px;
    display: block;
    margin-left: auto;
    margin-right: auto;
  }
  
  .logo h1 {
    font-size: 24px;
    margin-bottom: 4px;
  }
  
  .logo p {
    color: var(--color-text-muted);
    font-size: 13px;
  }
  
  form {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  /* .error-message is currently unused; keep styles for potential future use */
  .error-message {
    display: none;
  }
  
  .form-group {
    margin-bottom: 16px;
  }
  
  .form-group label {
    display: block;
    margin-bottom: 6px;
    font-weight: 500;
  }
  
  button {
    width: 100%;
    margin-top: 8px;
  }

  @media (max-width: 400px) {
    .login-card {
      padding: 24px 16px;
    }
    
  }
</style>
