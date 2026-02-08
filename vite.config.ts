import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  root: 'src/renderer',
  base: './',
  define: {
    // Polyfill process.env for packages that expect Node.js environment
    'process.env': {},
    'process.browser': true,
  },
  build: {
    outDir: '../../dist-renderer',
    emptyOutDir: true,
    sourcemap: false,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@renderer': path.resolve(__dirname, 'src/renderer'),
      '@crypto': path.resolve(__dirname, 'src/crypto'),
      '@qr': path.resolve(__dirname, 'src/qr'),
      '@config': path.resolve(__dirname, 'src/config'),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
  },
});
