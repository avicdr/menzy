import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  oxc: {
    jsx: { runtime: 'automatic' },
  },
  test: {
    globals: true,
    testTimeout: 20000,
    hookTimeout: 20000,
    setupFiles: ['dotenv/config'],
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
});
