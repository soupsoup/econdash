import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import IndicatorDetail from './pages/IndicatorDetail';
import { fetchAllIndicatorsData } from './services/api';
import { IndicatorData } from './types';

// Add minimal debug logging
console.log('App.tsx: Environment:', {
  isProd: import.meta.env.PROD,
  nodeEnv: import.meta.env.NODE_ENV
});
console.log('App.tsx: App component is about to render');

function App() {
  console.log('App.tsx: Inside App function');
  const [indicatorsData, setIndicatorsData] = useState<IndicatorData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    console.log('App.tsx: useEffect running');
    const loadData = async () => {
      try {
        console.log('App.tsx: Fetching all indicators data...');
        const data = await fetchAllIndicatorsData();
        setIndicatorsData(data);
        console.log('App.tsx: Data fetched and set', data);
      } catch (err) {
        console.error('Error fetching indicator data:', err);
        setError(err instanceof Error ? err : new Error('Failed to load data'));
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    console.log('App.tsx: Loading state');
    return (
      <div style={{ 
        padding: '20px', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        minHeight: '100vh'
      }}>
        <h1>Loading...</h1>
        <p>Please wait while we fetch the data...</p>
      </div>
    );
  }

  if (error) {
    console.log('App.tsx: Error state', error);
    return (
      <div style={{ 
        padding: '20px', 
        color: 'red',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh'
      }}>
        <h1>Error loading application</h1>
        <p>{error.message}</p>
        <p>Please try refreshing the page. If the problem persists, contact support.</p>
      </div>
    );
  }

  console.log('App.tsx: Rendering main app UI');
  return (
    <Router>
      <div style={{ padding: '20px' }}>
        <Routes>
          <Route path="/" element={<Dashboard indicatorsData={indicatorsData} />} />
          {/* <Route path="/indicator/:id" element={<IndicatorDetail indicatorsData={indicatorsData} />} /> */}
          {/* <Route path="*" element={<Navigate to="/" replace />} /> */}
        </Routes>
      </div>
    </Router>
  );
}

export default App;