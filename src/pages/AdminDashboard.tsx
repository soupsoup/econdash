
import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import DataUpload from '../components/DataUpload';
import AdminDataTable from '../components/AdminDataTable';
import AdminLogin from '../components/AdminLogin';
import { economicIndicators } from '../data/indicators';

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [selectedIndicator, setSelectedIndicator] = useState(economicIndicators[0].id);

  if (!isAuthenticated) {
    return <AdminLogin onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Indicator
        </label>
        <select
          value={selectedIndicator}
          onChange={(e) => setSelectedIndicator(e.target.value)}
          className="w-full p-2 border rounded"
        >
          {economicIndicators.map(indicator => (
            <option key={indicator.id} value={indicator.id}>
              {indicator.name}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Upload Data</h2>
        <DataUpload onUpload={() => {
          // Force a re-render of the data table
          setSelectedIndicator(prev => prev);
        }} />
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Indicator Visibility</h2>
        <IndicatorVisibilityControl />
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Manage Data Points</h2>
        <AdminDataTable indicatorId={selectedIndicator} />
      </div>
    </div>
  );
}
