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
      'process.env.FRED_API_KEY': JSON.stringify('')
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
        }
      }
    }
  };
});