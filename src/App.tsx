import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { useQuery } from 'react-query';
import Dashboard from './pages/Dashboard';
import IndicatorDetail from './pages/IndicatorDetail';
import ApiStatusBanner from './components/ApiStatusBanner';
import { fetchAllIndicatorsData } from './services/api';

function App() {
  const { error } = useQuery('dataSourceCheck', fetchAllIndicatorsData, {
    refetchOnWindowFocus: false,
    staleTime: Infinity,
    retry: 0,
    enabled: false // Don't actually run this query, we just want to initialize it
  });
  
  const hasApiErrors = !!error;
  
  return (
    <>
      {hasApiErrors && <ApiStatusBanner />}
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/indicator/:id" element={<IndicatorDetail />} />
      </Routes>
    </>
  );
}

export default App;