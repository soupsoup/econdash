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
      // BLS API proxy
      '/api/bls': {
        target: 'https://api.bls.gov',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api\/bls/, ''),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            proxyReq.setHeader('Content-Type', 'application/json');
            proxyReq.setHeader('Registrationkey', 'ce15238949e14526b9b13c2ff4beabfc');
          });
          proxy.on('error', (err) => console.error('BLS Proxy Error:', err));
        }
      },
      // FRED API proxy
      '/fred': {
        target: 'https://api.stlouisfed.org',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path,
        configure: (proxy) => {
          proxy.on('error', (err) => console.error('FRED Proxy Error:', err));
        }
      },
      // EIA API proxy
      '/api/eia': {
        target: 'https://api.eia.gov',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api\/eia/, ''),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            proxyReq.setHeader('Content-Type', 'application/json');
            proxyReq.setHeader('Accept', 'application/json');
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('EIA Proxy Response:', {
              status: proxyRes.statusCode,
              headers: proxyRes.headers
            });
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            proxyReq.setHeader('Content-Type', 'application/json');
            proxyReq.setHeader('Accept', 'application/json');
          });
          proxy.on('error', (err) => console.error('EIA Proxy Error:', err));
        }
      }
    }
  }
});