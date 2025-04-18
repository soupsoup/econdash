
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { useQuery } from 'react-query';
import Dashboard from './pages/Dashboard';
import IndicatorDetail from './pages/IndicatorDetail';
import ApiStatusBanner from './components/ApiStatusBanner';
import { fetchAllIndicatorsData } from './services/api';
import ErrorBoundary from './components/ErrorBoundary';
import AdminDashboard from './pages/AdminDashboard';

function App() {
  const { error } = useQuery('dataSourceCheck', fetchAllIndicatorsData, {
    refetchOnWindowFocus: false,
    staleTime: Infinity,
    retry: 2,
    enabled: true,
    cacheTime: Infinity
  });

  const hasApiErrors = !!error;

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
    </>
  );
}

export default App;
