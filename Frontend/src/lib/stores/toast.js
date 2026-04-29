import { writable } from 'svelte/store';

function createToastStore() {
  const { subscribe, set, update } = writable([]);
  
  let timeouts = new Map();
  
  function add(message, type = 'error', duration = 5000) {
    const id = Date.now() + Math.random();
    const toast = { id, message, type };
    
    update(toasts => [...toasts, toast]);
    
    if (timeouts.has(id)) {
      clearTimeout(timeouts.get(id));
    }
    
    const timeout = setTimeout(() => {
      remove(id);
    }, duration);
    
    timeouts.set(id, timeout);
    
    return id;
  }
  
  function remove(id) {
    if (timeouts.has(id)) {
      clearTimeout(timeouts.get(id));
      timeouts.delete(id);
    }
    update(toasts => toasts.filter(t => t.id !== id));
  }
  
  return {
    subscribe,
    add,
    remove,
    error: (message, duration) => add(message, 'error', duration),
    success: (message, duration) => add(message, 'success', duration),
    warning: (message, duration) => add(message, 'warning', duration)
  };
}

export const toastStore = createToastStore();