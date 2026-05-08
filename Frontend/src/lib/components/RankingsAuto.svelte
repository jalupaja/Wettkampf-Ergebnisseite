<script>
  import { onMount, onDestroy } from 'svelte';
  import { api } from '../api.js';
  import { CompetitionStates } from 'shared/competitionStates.js';

  let results = [];
  let config = {};
  let intervalId;
  let refreshMs = 10000; // 10s

  // Pagination pages: array of arrays of group indices
  let pages = [];
  let currentPage = 0;

  // Refs
  let container;

  async function load() {
    try {
      const cfg = await api.config.get();
      config = cfg.config || {};
      const data = await api.results.get();
      results = data.results || [];
      // build pages after DOM updates
      await tick();
      buildPages();
    } catch (e) {
      console.error('Failed to load rankings auto', e);
    }
  }

  import { tick } from 'svelte';

  function buildPages() {
    pages = [];
    currentPage = 0;
    if (!container) return;
    // If everything fits on viewport, make single page with all groups
    const totalHeight = container.scrollHeight;
    const viewport = window.innerHeight;
    if (totalHeight <= viewport) {
      pages = [results.map((_, i) => i)];
      return;
    }

    // Otherwise, measure individual group heights and chunk into pages containing whole groups
    const groupEls = Array.from(container.querySelectorAll('.group'));
    let page = [];
    let acc = 0;
    for (let i = 0; i < groupEls.length; i++) {
      const h = groupEls[i].offsetHeight;
      if (acc + h > viewport && page.length > 0) {
        pages.push(page);
        page = [];
        acc = 0;
      }
      page.push(i);
      acc += h;
    }
    if (page.length) pages.push(page);
  }

  function nextPage() {
    if (pages.length <= 1) return;
    currentPage = (currentPage + 1) % pages.length;
  }

  onMount(async () => {
    await load();
    intervalId = setInterval(async () => {
      await load();
      // advance page only when there is more than one
      if (pages.length > 1) nextPage();
    }, refreshMs);
    window.addEventListener('resize', buildPages);
  });

  onDestroy(() => {
    clearInterval(intervalId);
    window.removeEventListener('resize', buildPages);
  });

  // helper to show only finale when competitionState == FINALE
  function isFinale() {
    return config.competitionState === CompetitionStates.FINALE;
  }
</script>

<div class="rankings-auto" bind:this={container}>
  {#if results.length === 0}
    <div class="empty">Keine Ranglisten verfügbar</div>
  {:else}
    {#if pages.length === 0}
      <!-- initial render: show all groups until pages built -->
      {#each results as group}
        <section class="group">
          <h1 class="group-title">{group.groupName}</h1>
          <table class="results-table">
            <thead><tr><th>#</th><th>Name</th><th>Pkte</th><th>Finale</th></tr></thead>
            <tbody>
              {#each group.athletes as athlete, idx}
                <tr>
                  <td>{idx + 1}</td>
                  <td>{athlete.username}</td>
                  <td>{isFinale() ? (athlete.finalePoints ?? 0) : (athlete.totalPoints ?? 0)}</td>
                  <td>{isFinale() ? (athlete.finaleTotalTime ?? '') : ''}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </section>
      {/each}
    {:else}
      {#each pages as page, pidx}
        {#if pidx === currentPage}
          {#each page as gi}
            {#if results[gi]}
              <section class="group">
                <h1 class="group-title">{results[gi].groupName}</h1>
                <table class="results-table">
                  <thead><tr><th>#</th><th>Name</th><th>Pkte</th><th>Finale</th></tr></thead>
                  <tbody>
                    {#each results[gi].athletes as athlete, idx}
                      <tr>
                        <td>{idx + 1}</td>
                        <td>{athlete.username}</td>
                        <td>{isFinale() ? (athlete.finalePoints ?? 0) : (athlete.totalPoints ?? 0)}</td>
                        <td>{isFinale() ? (athlete.finaleTotalTime ?? '') : ''}</td>
                      </tr>
                    {/each}
                  </tbody>
                </table>
              </section>
            {/if}
          {/each}
        {/if}
      {/each}
    {/if}
  {/if}
</div>

<style>
  .rankings-auto { padding: 16px; }
  .group { margin-bottom: 28px; }
  .group-title { font-size: 36px; margin: 8px 0 12px; color: var(--color-text); }
  .results-table { width: 100%; border-collapse: collapse; }
  .results-table th, .results-table td { padding: 8px 12px; border-bottom: 1px solid var(--color-border); text-align: left; }
  .results-table thead th { font-weight: 700; }
  .empty { text-align: center; padding: 40px; color: var(--color-text-muted); }
  @media (max-width: 800px) { .group-title { font-size: 24px; } }
</style>
