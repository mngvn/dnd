import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// `base` is set to the repo subpath for GitHub Pages project sites
// (https://<user>.github.io/<repo>/). Overridable via VITE_BASE; defaults to
// '/' for local dev.
export default defineConfig({
  base: process.env.VITE_BASE || '/',
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
  },
});
