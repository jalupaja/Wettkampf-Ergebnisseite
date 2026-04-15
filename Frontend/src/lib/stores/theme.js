import { writable } from 'svelte/store';

function createThemeStore() {
  const stored = typeof localStorage !== 'undefined' 
    ? localStorage.getItem('darkMode') 
    : 'true';
  const initial = stored !== null ? stored === 'true' : true;
  
  const { subscribe, set, update } = writable(initial);
  
  return {
    subscribe,
    toggle: () => update(v => {
      const newValue = !v;
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('darkMode', String(newValue));
      }
      return newValue;
    }),
    set: (value) => {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('darkMode', String(value));
      }
      set(value);
    }
  };
}

export const themeStore = createThemeStore();
