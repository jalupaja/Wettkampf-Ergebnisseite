<script>
  import { api } from '../api.js';
  import { userStore } from '../stores/user.js';
  
  let password = $state('');
  let error = $state('');
  let loading = $state(false);
  
  async function handleLogin(e) {
    e.preventDefault();
    error = '';
    loading = true;
    
    try {
      const data = await api.auth.login(password);
      userStore.login(data.user);
    } catch (err) {
      error = err.message;
    }
    loading = false;
  }
</script>

<div class="login-container">
  <div class="login-card">
    <div class="logo">
      <div class="logo-icon">W</div>
      <h1>Wettkampf</h1>
      <p>Kletterzentrum Regensburg</p>
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
</div>

<style>
  .login-container {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    padding: 20px;
  }
  
  .login-card {
    background: var(--color-bg-light);
    border-radius: 16px;
    padding: 40px;
    width: 100%;
    max-width: 400px;
    border: 1px solid var(--color-border);
  }
  
  .logo {
    text-align: center;
    margin-bottom: 32px;
  }
  
  .logo-icon {
    width: 80px;
    height: 80px;
    background: var(--color-primary);
    color: white;
    font-size: 40px;
    font-weight: bold;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 16px;
  }
  
  .logo h1 {
    font-size: 28px;
    margin-bottom: 4px;
  }
  
  .logo p {
    color: var(--color-text-muted);
    font-size: 14px;
  }
  
  form {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  
  .error-message {
    background: rgba(231, 76, 60, 0.1);
    border: 1px solid var(--color-error);
    color: var(--color-error);
    padding: 12px;
    border-radius: 8px;
    font-size: 14px;
    margin-bottom: 16px;
  }
  
  button {
    width: 100%;
    margin-top: 8px;
  }
</style>
