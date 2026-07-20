import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      '@mern-3dviz/shared': path.resolve(__dirname, '../shared/src/index.ts'),
      '@mern-3dviz/shared/': path.resolve(__dirname, '../shared/src/') + path.sep,
    },
  },
  test: {
    env: {
      // Defaults applied only when an env var is NOT already set in the process.
      // Real values come from server/.env.test (sourced below).
      NODE_ENV: 'test',
    },
    setupFiles: ['./src/__tests__/setup.ts'],
    testTimeout: 20_000,
    hookTimeout: 20_000,
    pool: 'forks', // safer than threads when hitting a real Mongo
  },
});