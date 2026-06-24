import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@core': path.resolve(__dirname, 'src/core'),
      '@game': path.resolve(__dirname, 'src/game'),
      '@render': path.resolve(__dirname, 'src/render'),
      '@ui': path.resolve(__dirname, 'src/ui'),
    },
  },
});
