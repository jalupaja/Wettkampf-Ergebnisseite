<script>
  import { userStore } from '../stores/user.js';
  import AthleteDashboard from './AthleteDashboard.svelte';
  import AdminDashboard from './AdminDashboard.svelte';
</script>

{#if ['admin', 'schiedsrichter'].includes($userStore?.role)}
  <AdminDashboard />
{:else}
  <AthleteDashboard />
{/if}
