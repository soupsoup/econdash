import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { useQuery } from 'react-query';
import Dashboard from './pages/Dashboard';
import IndicatorDetail from './pages/IndicatorDetail';
import ApiStatusBanner from './components/ApiStatusBanner';
import ErrorBoundary from './components/ErrorBoundary';
import AdminDashboard from './pages/AdminDashboard';
import DebugInfo from './components/DebugInfo';
import { fetchAllIndicatorsData } from './services/api';

function App() {
  const { error, isLoading } = useQuery('dataSourceCheck', fetchAllIndicatorsData);

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {error && <ApiStatusBanner />}
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