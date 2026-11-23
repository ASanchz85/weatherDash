import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

const BACKEND_DEV_URL = process.env.BACKEND_DEV_URL ?? 'http://localhost:3000';

export default defineConfig({
  plugins: [react()],
  server: {
    // En desarrollo Vite reenvía /api al backend, por lo que no se necesita CORS.
    proxy: { '/api': BACKEND_DEV_URL },
  },
  build: {
    target: 'es2022',
    // Imágenes y fuentes se sirven como ficheros independientes, cacheables por el navegador.
    assetsInlineLimit: 0,
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['src/test/setup.ts'],
    env: { TZ: 'Europe/Madrid' },
  },
});
