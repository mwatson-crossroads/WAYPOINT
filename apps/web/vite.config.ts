import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@hub/core': fileURLToPath(new URL('../../packages/core/src/index.ts', import.meta.url)) },
  },
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': 'http://localhost:4300',
      '/ws': { target: 'ws://localhost:4300', ws: true },
    },
  },
});
