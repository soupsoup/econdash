import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
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
            proxy.on('proxyReq', (proxyReq, req) => {
              // Add API key to the request
              const apiKey = env.VITE_FRED_API_KEY;
              if (apiKey) {
                const url = new URL(proxyReq.path, 'https://api.stlouisfed.org');
                url.searchParams.set('api_key', apiKey);
                proxyReq.path = url.pathname + url.search;
                console.log('Added API key to request');
              } else {
                console.error('FRED API key not found in environment variables');
              }
            });
          }
        }
      }
    }
  };
});