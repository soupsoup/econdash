
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { useQuery } from 'react-query';
import Dashboard from './pages/Dashboard';
import IndicatorDetail from './pages/IndicatorDetail';
import AdminDashboard from './pages/AdminDashboard';
import ApiStatusBanner from './components/ApiStatusBanner';
import { fetchAllIndicatorsData } from './services/api';
import ErrorBoundary from './components/ErrorBoundary';
import DebugInfo from './components/DebugInfo';

function App() {
  console.log('App component rendering');
  
  const { error } = useQuery('dataSourceCheck', fetchAllIndicatorsData, {
    refetchOnWindowFocus: false,
    staleTime: Infinity,
    retry: 0,
    enabled: true,
    cacheTime: Infinity
  });

  const hasApiErrors = !!error;

  return (
    <div className="min-h-screen bg-gray-50">
      {hasApiErrors && <ApiStatusBanner />}
      <ErrorBoundary>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/indicator/:id" element={<IndicatorDetail />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
      </ErrorBoundary>
      <DebugInfo />
    </div>
  );
}

export default App;
