import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Relative base: the site works from any path, including a GitHub Pages project page.
// Two pages: the Visualiser at / and the Ranked trainer at /ranked/.
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    rollupOptions: {
      input: { visualiser: 'index.html', ranked: 'ranked/index.html' },
    },
  },
});
