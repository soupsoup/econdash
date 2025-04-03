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
              const body = req.body;
              if (body) {
                const bodyData = JSON.stringify(body);
                proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
                proxyReq.write(bodyData);
              }
            }
          });
          proxy.on('error', (err) => console.error('BLS Proxy Error:', err));
        }
      },
      // FRED API proxy
      '/api/fred': {
        target: 'https://api.stlouisfed.org',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/fred/, ''),
        configure: (proxy) => {
          proxy.on('error', (err, req, res) => {
            console.error('FRED Proxy Error:', err);
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('FRED Proxy Request:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('FRED Proxy Response:', proxyRes.statusCode);
          });
        }
      },
      // EIA API proxy
      '/api/eia': {
        target: 'https://api.eia.gov',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/eia/, ''),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            proxyReq.setHeader('Content-Type', 'application/json');
            proxyReq.setHeader('Accept', 'application/json');
            // Add API key to query params
            const url = new URL(proxyReq.path, 'https://api.eia.gov');
            url.searchParams.append('api_key', process.env.VITE_EIA_API_KEY);
            proxyReq.path = url.pathname + url.search;
          });
          proxy.on('error', (err) => console.error('EIA Proxy Error:', err));
        }
      }
    }
  }
});