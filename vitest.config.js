import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@modules':    path.resolve(__dirname, './src/modules'),
      '@layouts':    path.resolve(__dirname, './src/layouts'),
      '@hooks':      path.resolve(__dirname, './src/hooks'),
      '@utils':      path.resolve(__dirname, './src/utils'),
      '@app':        path.resolve(__dirname, './src/app'),
      '@auth':       path.resolve(__dirname, './src/auth'),
      '@assets':     path.resolve(__dirname, './src/assets'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/tests/setup.ts'],
    reporters: ['verbose', 'junit'],
    outputFile: {
      junit: './reports/junit-front.xml',
    },
    css: false,
    pool: 'forks',
    poolOptions: {
      forks: { singleFork: true },
    },
  },
});
