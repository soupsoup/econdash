
import React, { useState } from 'react';
import { economicIndicators } from '../data/indicators';
import DataUpload from '../components/DataUpload';
import IndicatorChart from '../components/IndicatorChart';
import DataTable from '../components/DataTable';
import { useQuery } from 'react-query';
import { fetchAllIndicatorsData } from '../services/api';

export default function AdminDashboard() {
  const [selectedIndicator, setSelectedIndicator] = useState('');
  
  const { data: indicatorsData, refetch } = useQuery('allIndicatorsData', fetchAllIndicatorsData, {
    refetchOnWindowFocus: false
  });

  const selectedData = indicatorsData?.find(d => d.indicator.id === selectedIndicator);

  const handleDataUpload = () => {
    refetch();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold mb-8">Admin Dashboard</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Data Upload</h2>
            <DataUpload onUpload={handleDataUpload} />
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Data Preview</h2>
            <select 
              value={selectedIndicator}
              onChange={(e) => setSelectedIndicator(e.target.value)}
              className="w-full p-2 border rounded mb-4"
            >
              <option value="">Select Indicator...</option>
              {economicIndicators.map(indicator => (
                <option key={indicator.id} value={indicator.id}>
                  {indicator.name}
                </option>
              ))}
            </select>

            {selectedIndicator ? (
              selectedData ? (
                <>
                  <div className="h-64 mb-4">
                    <IndicatorChart data={selectedData} />
                  </div>
                  <DataTable data={selectedData.data} />
                </>
              ) : (
                <div className="text-gray-500 text-center py-8">
                  Loading data...
                </div>
              )
            ) : (
              <div className="text-gray-500 text-center py-8">
                Select an indicator to view its data
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
