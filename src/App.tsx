
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
import ErrorDisplay from './components/ErrorDisplay';

function App() {
  const { error, isLoading } = useQuery('dataSourceCheck', fetchAllIndicatorsData, {
    refetchOnWindowFocus: false,
    staleTime: 0,
    retry: 2,
    enabled: true,
    onError: (err) => {
      console.error('Initial data fetch failed:', {
        message: err.message,
        stack: err.stack,
        timestamp: new Date().toISOString(),
        url: window.location.href
      });
    }
  });

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {error && (
        <>
          <ApiStatusBanner />
          <ErrorDisplay
            title="Data Loading Error"
            message="Failed to load initial application data"
            details={error instanceof Error ? error.message : String(error)}
          />
        </>
      )}
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
