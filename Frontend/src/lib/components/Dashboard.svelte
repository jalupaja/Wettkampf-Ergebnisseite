<script>
  import { userStore } from '../stores/user.js';
  import AthleteDashboard from './AthleteDashboard.svelte';
  import AdminDashboard from './AdminDashboard.svelte';
</script>

{#if $userStore?.role === 'admin'}
  <AdminDashboard />
{:else}
  <AthleteDashboard />
{/if}
