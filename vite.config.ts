import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Use empty prefix to load all env regardless of prefix
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react()],
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src")
      },
    },
    build: {
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              return 'vendor';
            }
          }
        }
      }
    },
    define: {
      // Use environment variables instead of hardcoded values
      'import.meta.env.VITE_ALPHA_VANTAGE_API_KEY': JSON.stringify(env.VITE_ALPHA_VANTAGE_API_KEY),
      'import.meta.env.VITE_METAL_PRICE_API_KEY': JSON.stringify(env.VITE_METAL_PRICE_API_KEY)
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
          rewrite: (path) => {
            const url = new URL(path, 'http://localhost');
            const searchParams = new URLSearchParams(url.search);
            
            // Remove API key handling from development proxy
            // API key will be handled by Netlify function only
            
            // Ensure file_type is set to json
            if (!searchParams.has('file_type')) {
              searchParams.set('file_type', 'json');
            }
            
            // Remove /api/fred from the path and add /fred
            const newPath = `/fred${url.pathname.replace(/^\/api\/fred/, '')}`;
            
            return `${newPath}?${searchParams.toString()}`;
          },
          configure: (proxy, options) => {
            proxy.on('error', (err, req, res) => {
              console.error('FRED API proxy error:', err);
              const errorResponse = {
                error: 'Failed to fetch data from FRED API',
                details: err.message
              };
              res.writeHead(500, {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
              });
              res.end(JSON.stringify(errorResponse));
            });
          }
        },
        '/api/metal': {
          target: 'https://api.metalpriceapi.com',
          changeOrigin: true,
          secure: true,
          rewrite: (path) => {
            const url = new URL(path, 'http://localhost');
            const params = new URLSearchParams(url.search);
            params.set('api_key', env.VITE_METAL_PRICE_API_KEY);
            return `${url.pathname.replace(/^\/api\/metal/, '')}?${params.toString()}`;
          },
          configure: (proxy, options) => {
            proxy.on('error', (err, req, res) => {
              console.error('Metal Price API proxy error:', err);
              const errorResponse = {
                error: 'Failed to fetch data from Metal Price API',
                details: err.message
              };
              res.writeHead(500, {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
              });
              res.end(JSON.stringify(errorResponse));
            });
          }
        },
        '/api/economic-calendar': {
          target: 'https://www.investing.com/economic-calendar',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => '/Service/getCalendarFilteredData',
          configure: (proxy, options) => {
            proxy.on('error', (err, req, res) => {
              console.error('Economic Calendar proxy error:', err);
              const errorResponse = {
                error: 'Failed to fetch data from Economic Calendar',
                details: err.message
              };
              res.writeHead(500, {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
              });
              res.end(JSON.stringify(errorResponse));
            });
            proxy.on('proxyReq', (proxyReq, req, res) => {
              proxyReq.setHeader('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
              proxyReq.setHeader('X-Requested-With', 'XMLHttpRequest');
              proxyReq.setHeader('Accept', 'application/json');
              proxyReq.setHeader('Content-Type', 'application/x-www-form-urlencoded');
              proxyReq.setHeader('Origin', 'https://www.investing.com');
              proxyReq.setHeader('Referer', 'https://www.investing.com/economic-calendar/');
            });
          }
        },
        '/api/alpha-vantage': {
          target: 'https://www.alphavantage.co',
          changeOrigin: true,
          secure: true,
          rewrite: (path) => {
            const url = new URL(path, 'http://localhost');
            const params = new URLSearchParams(url.search);
            params.set('apikey', env.VITE_ALPHA_VANTAGE_API_KEY);
            return `/query?${params.toString()}`;
          }
        },
        '/api/calendar': {
          target: 'https://www.jblanked.com',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api\/calendar/, '/news/api'),
          configure: (proxy, options) => {
            proxy.on('error', (err, req, res) => {
              console.error('JBlanked proxy error:', err);
            });
            proxy.on('proxyReq', (proxyReq, req, res) => {
              proxyReq.setHeader('Origin', 'https://www.jblanked.com');
              proxyReq.setHeader('Referer', 'https://www.jblanked.com');
            });
          }
        },
        '/api/wire': {
          target: 'http://localhost:8888/.netlify/functions/wire',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/wire/, ''),
        },
        '/api/wire-settings': {
          target: 'http://localhost:8888/.netlify/functions/wire-settings',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/wire-settings/, ''),
        },
      }
    }
  };
});