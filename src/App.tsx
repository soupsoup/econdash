import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import IndicatorDetail from './pages/IndicatorDetail';
import { fetchAllIndicatorsData } from './services/api';
import { IndicatorData } from './types';

// Add detailed debug logging
console.log('App.tsx: Environment:', {
  isProd: import.meta.env.PROD,
  nodeEnv: import.meta.env.NODE_ENV,
  hasSupabaseUrl: !!import.meta.env.VITE_SUPABASE_URL,
  hasSupabaseKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
  envKeys: Object.keys(import.meta.env)
});

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
    return (
      <div style={{ padding: '20px' }}>
        <h1>Loading...</h1>
        <p>Please wait while we fetch the data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px', color: 'red' }}>
        <h1>Error loading application:</h1>
        <pre>{error.message}</pre>
        <pre>{error.stack}</pre>
      </div>
    );
  }

  return (
    <Router>
      <div style={{ padding: '20px' }}>
        <Routes>
          <Route path="/" element={<Dashboard indicatorsData={indicatorsData} />} />
          <Route path="/indicator/:id" element={<IndicatorDetail indicatorsData={indicatorsData} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;