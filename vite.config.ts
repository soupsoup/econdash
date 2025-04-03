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
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/bls/, ''),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            proxyReq.setHeader('Content-Type', 'application/json');
            proxyReq.setHeader('Accept', 'application/json');
            if (req.method === 'POST') {
              const bodyData = JSON.stringify({
                ...req.body,
                registrationkey: process.env.VITE_BLS_API_KEY
              });
              proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
              proxyReq.write(bodyData);
            }
          });
          proxy.on('error', (err) => console.error('BLS Proxy Error:', err));
        }
      },
      // FRED API proxy
      '/api/fred': {
        target: 'https://api.stlouisfed.org',
        changeOrigin: true,
        rewrite: (path) => {
          const url = new URL(path.replace(/^\/api\/fred/, ''), 'https://api.stlouisfed.org');
          url.searchParams.append('api_key', process.env.VITE_FRED_API_KEY);
          return url.pathname + url.search;
        },
        configure: (proxy) => {
          proxy.on('error', (err) => console.error('FRED Proxy Error:', err));
        }
      },
      // EIA API proxy
      '/api/eia': {
        target: 'https://api.eia.gov',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => {
          const url = new URL(path.replace(/^\/api\/eia/, ''), 'https://api.eia.gov');
          url.searchParams.append('api_key', process.env.VITE_EIA_API_KEY);
          return url.pathname + url.search;
        },
        configure: (proxy) => {
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