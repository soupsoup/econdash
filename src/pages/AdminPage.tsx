import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import AdminLogin from '../components/AdminLogin';
import { Navigate } from 'react-router-dom';

const AdminPage: React.FC = () => {
  const { isAdmin } = useAuth();

  // If already logged in, redirect to admin dashboard
  if (isAdmin) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">Admin Access</h1>
        <div className="mb-6">
          <AdminLogin />
        </div>
        <p className="text-sm text-gray-600 text-center mt-4">
          This area is restricted to authorized administrators only.
        </p>
      </div>
    </div>
  );
};

export default AdminPage; 