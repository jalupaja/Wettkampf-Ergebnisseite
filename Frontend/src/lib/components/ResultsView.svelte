<script>
  import { onMount, onDestroy } from 'svelte';
  import { api } from '../api.js';
  import { userStore } from '../stores/user.js';
  import { themeStore } from '../stores/theme.js';
  import RankingsTable from './RankingsTable.svelte';

  let { admin = false, onLogin } = $props();
  let isDark = $state(true);

  let results = $state([]);
  let config = $state(null);
  let loading = $state(true);
  let error = $state('');
  let refreshInterval;

  themeStore.subscribe(value => { isDark = value; });

  onMount(async () => {
    await loadResults();
    refreshInterval = setInterval(loadResults, 30000);
  });

  onDestroy(() => {
    if (refreshInterval) clearInterval(refreshInterval);
  });

  import { CompetitionStates } from 'shared/competitionStates.js';

  async function loadResults() {
    try {
      const data = await api.results.get();
      results = data.results;
      config = data.config;

      if (config?.competitionState === CompetitionStates.FINALE) {
        console.log('[FRONTEND] Results received from API:');
        results.forEach(group => {
          console.log(`  Group "${group.groupName}": ${group.athletes.map((a, i) => `${i + 1}. ${a.username} (${a.finalePoints}pts, time=${a.finaleTotalTime}s)`).join(' → ')}`);
        });
      }
    } catch (err) {
      error = err.message;
    }
    loading = false;
  }
</script>

<div class="results-view">
  {#if !$userStore}
    <div class="header">
      <div class="title-section">
        <h2>Rangliste</h2>
        {#if config?.rulesUrl}
          <a class="rules-link" href="{config.rulesUrl}" target="_blank">
            Regeln
          </a>
        {/if}
      </div>
      <div class="button-group">
        <button class="theme-btn" onclick={() => themeStore.toggle()} title={isDark ? 'Light mode' : 'Dark mode'}>
          {isDark ? '☀️' : '🌙'}
        </button>
        {#if onLogin}
          <button class="login-btn" onclick={onLogin}>Anmelden</button>
        {/if}
      </div>
    </div>
  {/if}

  <RankingsTable {results} {loading} {error} {config} />
</div>

<style>
  .results-view {
    max-width: 1000px;
    min-height: 100vh;
    margin: 0 auto;
    padding: 0 16px;
  }

  .button-group { display: flex; gap: 8px; }
  .theme-btn {
    background: var(--color-bg-light);
    border: 1px solid var(--color-border);
    padding: 10px 14px;
    border-radius: 8px;
    font-size: 18px;
    cursor: pointer;
  }
  .theme-btn:hover { background: var(--color-bg-lighter); }
  .header {
    padding-top: 24px;
    display: flex;
    justify-content: space-between; align-items: flex-start;
    align-items: center;
    margin-bottom: 24px;
    flex-wrap: wrap;
    gap: 16px;
  }

  .title-section {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .title-section h2 { font-size: 24px; }

  .rules-link {
    background: var(--color-bg-lighter);
    padding: 8px 16px;
    border-radius: 8px;
    border: 1px solid var(--color-border);
    color: var(--color-white);
    text-decoration: none;
    font-size: 14px;
    cursor: pointer;
    opacity: 1;
  }

  .rules-link:hover {
    background: var(--color-bg-light);
    border-color: var(--color-primary);
    opacity: 1;
  }

  .login-btn {
    background: var(--color-primary);
    color: var(--color-text);
    padding: 10px 20px;
    border-radius: 8px;
    font-weight: 500;
    cursor: pointer;
  }

  @media (max-width: 640px) {
    .results-view { padding: 0 12px; }
    .button-group { display: flex; gap: 8px; }
    .header { padding-top: 24px; flex-direction: row; }
    .title-section { flex-direction: row; gap: 8px; }
    .title-section h2 { font-size: 20px; }
    .rules-link { padding: 6px 12px; font-size: 12px; }
    .login-btn { padding: 8px 16px; font-size: 13px; }
  }
</style>
