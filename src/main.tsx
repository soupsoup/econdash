
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from 'react-query';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

console.log("Main.tsx is executing");
const rootElement = document.getElementById('root');
console.log("Root element found:", !!rootElement);

if (!rootElement) {
  throw new Error('Root element not found');
}

try {
  console.log("Creating React root");
  const root = createRoot(rootElement);
  console.log("Rendering React app");
  root.render(
    <StrictMode>
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      </BrowserRouter>
    </StrictMode>
  );
  console.log("React app rendered successfully");
} catch (error) {
  console.error("Error rendering React app:", error);
  rootElement.innerHTML = `
    <div style="padding: 20px; font-family: sans-serif;">
      <h2>Error rendering application</h2>
      <p>There was an error rendering the React application. See console for details.</p>
      <pre>${error instanceof Error ? error.message : String(error)}</pre>
    </div>
  `;
}
