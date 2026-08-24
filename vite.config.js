import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  base: './',
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        audience: resolve(__dirname, 'audience.html'),
        stage: resolve(__dirname, 'stage.html'),
      },
    },
  },
  server: {
    port: 3000,
    open: false
  }
});
