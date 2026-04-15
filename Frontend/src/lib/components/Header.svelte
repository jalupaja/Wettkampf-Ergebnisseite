<script>
  import { api } from '../api.js';
  import { userStore } from '../stores/user.js';
  import { themeStore } from '../stores/theme.js';
  
  async function handleLogout() {
    try {
      await api.auth.logout();
      userStore.logout();
    } catch (err) {
      console.error('Logout error:', err);
    }
  }
  
  function toggleTheme() {
    themeStore.toggle();
  }
</script>

<header>
  <div class="header-content">
    <div class="logo">
      <div class="logo-icon">W</div>
      <span>Wettkampf</span>
    </div>
    
    <nav>
      <span class="user-info">
        {$userStore?.username}
        {#if $userStore?.role === 'admin'}
          <span class="badge">Admin</span>
        {:else}
          <span class="badge athlete">Athlet</span>
        {/if}
      </span>
      
      <button class="icon-btn" onclick={toggleTheme} title="Theme wechseln">
        {#if $themeStore}
          ☀️
        {:else}
          🌙
        {/if}
      </button>
      
      <button class="outline" onclick={handleLogout}>
        Abmelden
      </button>
    </nav>
  </div>
</header>

<style>
  header {
    background: var(--color-bg-light);
    border-bottom: 1px solid var(--color-border);
    padding: 0 20px;
    position: sticky;
    top: 0;
    z-index: 100;
  }
  
  .header-content {
    max-width: 1400px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 64px;
  }
  
  .logo {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  
  .logo-icon {
    width: 40px;
    height: 40px;
    background: var(--color-primary);
    color: white;
    font-size: 20px;
    font-weight: bold;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .logo span {
    font-size: 20px;
    font-weight: 600;
  }
  
  nav {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  
  .user-info {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .badge {
    background: var(--color-primary);
    color: white;
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 11px;
    font-weight: 600;
  }
  
  .badge.athlete {
    background: var(--color-secondary);
  }
  
  .icon-btn {
    background: transparent;
    border: 1px solid var(--color-border);
    padding: 8px 12px;
    font-size: 18px;
  }
</style>
