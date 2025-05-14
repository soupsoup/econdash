import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import IndicatorDetail from './pages/IndicatorDetail';
import AdminDashboard from './pages/AdminDashboard';
import AdminLoginPage from './pages/AdminLoginPage';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  useEffect(() => {
    // Cleanup: Always remove uploaded CPI data and preference on app startup
    localStorage.removeItem('economic_indicator_v3_uploaded_cpi');
    const prefsKey = 'economic_indicator_v3_data_source_preferences';
    const prefs = JSON.parse(localStorage.getItem(prefsKey) || '{}');
    if (prefs.cpi) {
      delete prefs.cpi;
      localStorage.setItem(prefsKey, JSON.stringify(prefs));
    }
  }, []);

  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/indicator/:id" element={<IndicatorDetail />} />
        <Route path="/admin" element={<AdminLoginPage />} />
        <Route path="/admin/dashboard" element={
          <ProtectedRoute>
            <AdminDashboard />
          </ProtectedRoute>
        } />
      </Routes>
    </AuthProvider>
  );
}

export default App;