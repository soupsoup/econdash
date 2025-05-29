import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import AdminLogin from '../components/AdminLogin';
import { Navigate, Link } from 'react-router-dom';
import { PlusCircle } from 'lucide-react';

const AdminPage: React.FC = () => {
  const { isAdmin } = useAuth();

  if (!isAdmin) {
    return <AdminLogin />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <Link
            to="/create-post"
            className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
          >
            <PlusCircle className="w-5 h-5" />
            <span>Create New Post</span>
          </Link>
        </div>
        
        {/* Add more admin features here */}
      </div>
    </div>
  );
};

export default AdminPage; 