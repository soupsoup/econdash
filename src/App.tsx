import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { theme } from './theme';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import IndicatorDetail from './pages/IndicatorDetail';
import { fetchAllIndicatorsData } from './services/api';
import { IndicatorData } from './types';
import { ErrorBoundary } from 'react-error-boundary';

// Add debug logging
console.log('App.tsx: Environment:', {
  isProd: import.meta.env.PROD,
  nodeEnv: import.meta.env.NODE_ENV,
  hasSupabaseUrl: !!import.meta.env.VITE_SUPABASE_URL,
  hasSupabaseKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY
});

function ErrorFallback({ error }: { error: Error }) {
  return (
    <div role="alert" style={{ padding: '20px', color: 'red' }}>
      <h2>Something went wrong:</h2>
      <pre>{error.message}</pre>
      <pre>{error.stack}</pre>
    </div>
  );
}

function App() {
  const [indicatorsData, setIndicatorsData] = useState<IndicatorData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('App.tsx: Starting to fetch indicator data...');
        const data = await fetchAllIndicatorsData();
        console.log('App.tsx: Successfully fetched indicator data:', {
          count: data.length,
          indicators: data.map(d => d.indicator.id)
        });
        setIndicatorsData(data);
      } catch (err) {
        console.error('App.tsx: Error fetching indicator data:', err);
        setError(err instanceof Error ? err : new Error('Failed to load data'));
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return (
      <div style={{ padding: '20px', color: 'red' }}>
        <h2>Error loading application:</h2>
        <pre>{error.message}</pre>
        <pre>{error.stack}</pre>
      </div>
    );
  }

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard indicatorsData={indicatorsData} />} />
              <Route path="/indicator/:id" element={<IndicatorDetail indicatorsData={indicatorsData} />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Layout>
        </Router>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;