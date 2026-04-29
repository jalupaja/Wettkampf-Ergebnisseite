<script>
  import { toastStore } from '../stores/toast.js';
  
  let toasts = $state([]);
  
  toastStore.subscribe(value => { toasts = value; });
</script>

{#if toasts.length > 0}
  <div class="toast-container">
    {#each toasts as toast (toast.id)}
      <div class="toast toast-{toast.type}" role="alert">
        <span class="toast-message">{toast.message}</span>
        <button class="toast-close" onclick={() => toastStore.remove(toast.id)} aria-label="Schließen">×</button>
      </div>
    {/each}
  </div>
{/if}

<style>
  .toast-container {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    padding: max(16px, env(safe-area-inset-top, 16px)) 16px max(16px, env(safe-area-inset-bottom, 16px));
    z-index: 9999;
    display: flex;
    flex-direction: column;
    gap: 8px;
    pointer-events: none;
  }
  
  .toast {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 14px 16px;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 500;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
    pointer-events: auto;
    animation: slideIn 0.2s ease-out;
  }
  
  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes slideOut {
    from {
      opacity: 1;
      transform: translateY(0);
    }
    to {
      opacity: 0;
      transform: translateY(-20px);
    }
  }
  
  .toast-error {
    background: var(--color-error);
    color: white;
  }
  
  .toast-success {
    background: #27ae60;
    color: white;
  }
  
  .toast-warning {
    background: #f39c12;
    color: white;
  }
  
  .toast-message {
    flex: 1;
  }
  
  .toast-close {
    background: none;
    border: none;
    color: inherit;
    font-size: 20px;
    cursor: pointer;
    padding: 0;
    line-height: 1;
    opacity: 0.8;
  }
  
  .toast-close:hover {
    opacity: 1;
  }
</style>