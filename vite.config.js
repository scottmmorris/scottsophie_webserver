import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  // Relative base so the site works at https://<user>.github.io/<repo>/
  // as well as at a custom domain or the root of a server.
  base: './',
  build: {
    // Set OUT_DIR=/var/www/html to build straight onto the old server.
    outDir: process.env.OUT_DIR || 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        home: resolve(__dirname, 'index.html'),
        travel: resolve(__dirname, 'travel/index.html'),
        tech: resolve(__dirname, 'tech/index.html'),
        kalman: resolve(__dirname, 'tech/kalman-filters/index.html'),
      },
    },
  },
});
