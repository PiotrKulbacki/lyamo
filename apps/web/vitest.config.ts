import path from 'node:path';
import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, '../../packages/shared/src'),
      '@web': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'node',
    exclude: [...configDefaults.exclude, 'integration/**', 'e2e/**'],
  },
});
