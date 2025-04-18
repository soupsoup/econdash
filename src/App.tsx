import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import IndicatorDetail from './pages/IndicatorDetail';
import AdminDashboard from './pages/AdminDashboard';
import ErrorBoundary from './components/ErrorBoundary';
import DebugInfo from './components/DebugInfo';
import ApiStatusBanner from './components/ApiStatusBanner';

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <ErrorBoundary>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/indicator/:id" element={<IndicatorDetail />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="*" element={
            <div className="p-4">
              <h1>Debug Info</h1>
              <p>Current Path: {window.location.pathname}</p>
              <p>React is working</p>
            </div>
          } />
        </Routes>
      </ErrorBoundary>
      <DebugInfo />
    </div>
  );
}

export default App;