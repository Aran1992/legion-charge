import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/legion-charge/' : '/',
  resolve: {
    alias: {
      '@core': path.resolve(__dirname, 'src/core'),
      '@game': path.resolve(__dirname, 'src/game'),
      '@render': path.resolve(__dirname, 'src/render'),
      '@ui': path.resolve(__dirname, 'src/ui'),
    },
  },
  server: {
    host: true,
  },
  build: {
    target: 'es2022',
  },
}));
