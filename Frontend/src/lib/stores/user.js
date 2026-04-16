import { writable } from 'svelte/store';

function createUserStore() {
  const { subscribe, set, update } = writable(null);
  
  return {
    subscribe,
    set,
    login: (user) => set(user),
    logout: () => set(null),
    update,
    updatePasswordChanged: () => update(u => u ? { ...u, needsPasswordChange: false } : null)
  };
}

export const userStore = createUserStore();
