import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import IndicatorDetail from './pages/IndicatorDetail';
import AdminDashboard from './pages/AdminDashboard';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/indicator/:id" element={<IndicatorDetail />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
      </div>
    </ErrorBoundary>
  );
}

export default App;