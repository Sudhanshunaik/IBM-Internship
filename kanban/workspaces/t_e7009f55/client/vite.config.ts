import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, '../shared/src'),
      '@mern-3dviz/shared': path.resolve(__dirname, '../shared/src/index.ts'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL ?? 'http://localhost:4000',
        changeOrigin: true,
      },
      '/socket.io': {
        target: process.env.VITE_API_URL ?? 'http://localhost:4000',
        ws: true,
        changeOrigin: true,
      },
    },
  },
  test: {
    environment: 'jsdom',
  },
});