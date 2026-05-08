import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import path from 'path';

export default defineConfig({
  plugins: [svelte()],
  resolve: {
    alias: {
      // allow imports like `import X from 'shared/...'` and
      // resolve them to the `Frontend/shared` folder during build
      shared: path.resolve(__dirname, 'shared')
    }
  },
  server: {
    // allow overriding the dev port with FRONTEND_PORT env var
    port: Number(process.env.FRONTEND_PORT) || 5173,
    host: '0.0.0.0',
    proxy: {
      // use VITE_API_URL when provided (useful inside containers),
      // otherwise fall back to localhost for local development
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:3001',
        changeOrigin: true,
        secure: false
      }
    }
  }
});
