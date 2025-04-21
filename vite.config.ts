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
      // Prevent environment variables from being included in the build
      'import.meta.env.VITE_FRED_API_KEY': JSON.stringify(''),
      'process.env.FRED_API_KEY': JSON.stringify(''),
      'import.meta.env.VITE_ALPHA_VANTAGE_API_KEY': JSON.stringify('KDTNQE681CX1CZNE')
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
          rewrite: (path) => path.replace(/^\/api\/fred/, ''),
          configure: (proxy, options) => {
            proxy.on('error', (err, req, res) => {
              console.error('Proxy error:', err);
            });
            proxy.on('proxyReq', (proxyReq, req, res) => {
              console.log('Proxying request:', {
                path: req.url,
                method: req.method,
                headers: proxyReq.getHeaders()
              });
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
              // Add required headers for investing.com
              proxyReq.setHeader('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
              proxyReq.setHeader('X-Requested-With', 'XMLHttpRequest');
              proxyReq.setHeader('Accept', 'application/json');
              proxyReq.setHeader('Content-Type', 'application/x-www-form-urlencoded');
              proxyReq.setHeader('Origin', 'https://www.investing.com');
              proxyReq.setHeader('Referer', 'https://www.investing.com/economic-calendar/');
              
              console.log('Proxying Economic Calendar request:', {
                path: proxyReq.path,
                method: proxyReq.method,
                headers: proxyReq.getHeaders()
              });
            });
            proxy.on('proxyRes', (proxyRes, req, res) => {
              console.log('Received Economic Calendar response:', {
                status: proxyRes.statusCode,
                headers: proxyRes.headers
              });
            });
          }
        },
        '/api/alpha-vantage': {
          target: 'https://www.alphavantage.co',
          changeOrigin: true,
          rewrite: (path) => {
            // Extract query parameters
            const url = new URL(path, 'http://localhost');
            const params = url.searchParams;
            
            // Add the API key
            params.set('apikey', 'KDTNQE681CX1CZNE');
            
            // Construct the new path
            return `/query?${params.toString()}`;
          },
          configure: (proxy, options) => {
            proxy.on('error', (err, req, res) => {
              console.error('Alpha Vantage proxy error:', err);
              // Send a more detailed error response
              const errorResponse = {
                error: 'Failed to fetch data from Alpha Vantage',
                details: err.message
              };
              res.writeHead(500, {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
              });
              res.end(JSON.stringify(errorResponse));
            });
            proxy.on('proxyReq', (proxyReq, req, res) => {
              console.log('Proxying Alpha Vantage request:', {
                path: proxyReq.path,
                method: proxyReq.method,
                headers: proxyReq.getHeaders()
              });
            });
            proxy.on('proxyRes', (proxyRes, req, res) => {
              console.log('Received Alpha Vantage response:', {
                status: proxyRes.statusCode,
                headers: proxyRes.headers
              });
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
              // Add CORS headers
              proxyReq.setHeader('Origin', 'https://www.jblanked.com');
              proxyReq.setHeader('Referer', 'https://www.jblanked.com');
              
              console.log('Proxying JBlanked request:', {
                path: proxyReq.path,
                method: proxyReq.method,
                headers: proxyReq.getHeaders()
              });
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