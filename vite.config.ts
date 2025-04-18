import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { createProxyMiddleware } from 'http-proxy-middleware';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
    hmr: {
      overlay: true,
    },
    proxy: {
      '/api/fred': {
        target: 'https://api.stlouisfed.org',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api\/fred/, '/fred'),
        configure: (proxy) => {
          proxy.on('error', (err) => console.error('FRED Proxy Error:', err));
        }
      }
    }
  }
});