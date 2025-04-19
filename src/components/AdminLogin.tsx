import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Lock, LogOut } from 'lucide-react';

const AdminLogin: React.FC = () => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { isAdmin, login, logout } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (login(password)) {
      setPassword('');
      setError('');
    } else {
      setError('Invalid password');
    }
  };

  if (isAdmin) {
    return (
      <div className="flex items-center">
        <button
          onClick={logout}
          className="flex items-center text-sm text-gray-600 hover:text-gray-800"
        >
          <LogOut className="h-4 w-4 mr-1" />
          Logout Admin
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center space-x-2">
      <div className="relative">
        <Lock className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Admin Password"
          className="pl-9 pr-3 py-1 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <button
        type="submit"
        className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        Login
      </button>
      {error && <span className="text-sm text-red-600">{error}</span>}
    </form>
  );
};

export default AdminLogin; 