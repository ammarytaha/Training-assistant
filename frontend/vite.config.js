import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// During development the frontend runs on :5173 and proxies API calls to the
// backend on :5000, so cookies are same-origin and no CORS pain in dev.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/auth': 'http://localhost:5000',
      '/api': 'http://localhost:5000',
      '/uploads': 'http://localhost:5000',
    },
  },
});
