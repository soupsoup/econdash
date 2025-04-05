import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { useQuery } from 'react-query';
import Dashboard from './pages/Dashboard';
import IndicatorDetail from './pages/IndicatorDetail';
import AdminDashboard from './pages/AdminDashboard';
import ApiStatusBanner from './components/ApiStatusBanner';
import { fetchAllIndicatorsData } from './services/api';
import ErrorBoundary from './components/ErrorBoundary'; // Assuming ErrorBoundary component exists

function App() {
  console.log('App component rendering');
  const { error } = useQuery('dataSourceCheck', fetchAllIndicatorsData, {
    refetchOnWindowFocus: false,
    staleTime: Infinity,
    retry: 0,
    enabled: false,
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
      {/* Debug information */}
      <div className="p-5 m-5 bg-white border border-gray-200 rounded shadow">
        <h1 className="text-2xl font-bold mb-4">Presidential Economic Dashboard</h1>
        <p className="mb-4">This dashboard is loading. If you see this message, React is working but there might be issues with the components.</p>
        <button 
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          onClick={() => console.log('Button clicked!')}
        >
          Test Button
        </button>
      </div>
    </>
  );
}

export default App;