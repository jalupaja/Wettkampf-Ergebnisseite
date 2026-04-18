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
    padding: 0 12px;
    position: sticky;
    top: 0;
    z-index: 100;
    overflow-x: auto;
  }
  
  .header-content {
    max-width: 1400px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 64px;
    gap: 12px;
    min-width: max-content;
  }
  
  .logo {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-shrink: 0;
  }
  
  .logo-icon {
    width: 36px;
    height: 36px;
    background: var(--color-primary);
    color: var(--color-white);
    font-size: 18px;
    font-weight: bold;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .logo span {
    font-size: 18px;
    font-weight: 600;
  }
  
  nav {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-shrink: 0;
  }
  
  .user-info {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
  }
  
  .badge {
    background: var(--color-primary);
    color: var(--color-white);
    padding: 2px 6px;
    border-radius: 10px;
    font-size: 10px;
    font-weight: 600;
  }
  
  .badge.athlete {
    background: var(--color-secondary);
  }
  
  .icon-btn {
    background: transparent;
    border: 1px solid var(--color-border);
    padding: 6px 10px;
    font-size: 16px;
  }
  
  nav button.outline {
    padding: 6px 12px;
    font-size: 12px;
  }
  
  @media (max-width: 480px) {
    .logo span {
      display: none;
    }
    
    .user-info {
      font-size: 12px;
    }
  }
</style>
