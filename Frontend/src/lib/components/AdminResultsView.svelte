<script>
  import { onMount, onDestroy } from 'svelte';
  import { api } from '../api.js';
  import RankingsTable from './RankingsTable.svelte';

  let results = $state([]);
  let config = $state(null);
  let loading = $state(true);
  let error = $state('');
  let refreshInterval;

  onMount(async () => {
    await loadResults();
    refreshInterval = setInterval(loadResults, 60000);
  });

  onDestroy(() => {
    if (refreshInterval) clearInterval(refreshInterval);
  });

  async function loadResults() {
    try {
      const data = await api.results.get();
      results = data.results;
      config = data.config;
    } catch (err) {
      error = err.message;
    }
    loading = false;
  }
</script>

<RankingsTable {results} {loading} {error} {config} />
