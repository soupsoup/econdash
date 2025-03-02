import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { useQuery } from 'react-query';
import Dashboard from './pages/Dashboard';
import IndicatorDetail from './pages/IndicatorDetail';
import ApiStatusBanner from './components/ApiStatusBanner';
import { fetchAllIndicatorsData } from './services/api';
import ErrorBoundary from './components/ErrorBoundary'; // Assuming ErrorBoundary component exists

function App() {
  const { error } = useQuery('dataSourceCheck', fetchAllIndicatorsData, {
    refetchOnWindowFocus: false,
    staleTime: Infinity,
    retry: 0,
    enabled: false 
  });

  const hasApiErrors = !!error;

  return (
    <>
      {hasApiErrors && <ApiStatusBanner />}
      <ErrorBoundary>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/indicator/:id" element={<IndicatorDetail />} />
        </Routes>
      </ErrorBoundary>
    </>
  );
}

export default App;