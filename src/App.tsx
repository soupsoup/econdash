import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { useQuery } from 'react-query';
import Dashboard from './pages/Dashboard';
import IndicatorDetail from './pages/IndicatorDetail';
import ApiStatusBanner from './components/ApiStatusBanner';
import { fetchAllIndicatorsData } from './services/api';
import ErrorBoundary from './components/ErrorBoundary';
import AdminDashboard from './pages/AdminDashboard';
import DebugInfo from './components/DebugInfo';

function App() {
  const { error, isLoading } = useQuery('dataSourceCheck', fetchAllIndicatorsData, {
    refetchOnWindowFocus: false,
    staleTime: 0, // Force fresh fetch
    retry: 2,
    enabled: true,
    onSuccess: () => console.log('Initial data fetch successful'),
    onError: (err) => console.error('Initial data fetch failed:', err)
  });

  const hasApiErrors = !!error;

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <>
      {hasApiErrors && <ApiStatusBanner />}
      <ErrorBoundary>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/indicator/:id" element={<IndicatorDetail />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
      </ErrorBoundary>
      <DebugInfo />
    </>
  );
}

export default App;