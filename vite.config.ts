import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react()],
    optimizeDeps: {
      exclude: ['lucide-react'],
      include: ['recharts', 'd3', 'chart.js', 'react-chartjs-2']
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src")
      },
    },
    build: {
      sourcemap: false,
      chunkSizeWarningLimit: 1000,
      target: 'esnext',
      rollupOptions: {
        output: {
          format: 'esm',
          manualChunks: {
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            'vendor-mui': ['@mui/material'],
            'vendor-charts': ['chart.js', 'react-chartjs-2'],
            'vendor-utils': ['date-fns', 'axios'],
          }
        },
        external: [
          '@mui/material/styles',
          '@mui/material/CssBaseline',
          '@emotion/react',
          '@emotion/styled'
        ]
      }
    },
    define: {
      // Use import.meta.env for environment variables
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY),
      // Use empty strings for sensitive variables in client-side code
      'import.meta.env.VITE_METAL_PRICE_API_KEY': JSON.stringify(''),
      'import.meta.env.VITE_FRED_API_KEY': JSON.stringify(''),
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
            // Remove API key from rewrite
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
        '/.netlify/functions': {
          target: 'http://localhost:8888',
          changeOrigin: true,
          secure: false,
        },
      }
    }
  };
});