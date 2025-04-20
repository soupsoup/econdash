import React, { useState } from 'react';
import { economicIndicators } from '../data/indicators';
import ApiStatusChecker from '../components/ApiStatusChecker';
import DataUpload from '../components/DataUpload';
import IndicatorChart from '../components/IndicatorChart';
import DataTable from '../components/DataTable';
import { useQuery } from 'react-query';
import { fetchAllIndicatorsData, updateIndicatorData, getDataSourcePreferences, setDataSourcePreference, getLastUpdated } from '../services/api';
import ChartVisibilityControl from '../components/ChartVisibilityControl';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { IndicatorDataPoint } from '../types';
import { Edit2, Save, X, LogOut, Database } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
  const [selectedIndicator, setSelectedIndicator] = useState('');
  const [visibleCharts, setVisibleCharts] = useLocalStorage<string[]>('visibleCharts', 
    economicIndicators.map(i => i.id));
  const [editingDescription, setEditingDescription] = useState('');
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();
  
  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const { data: indicatorsData, refetch } = useQuery('allIndicatorsData', fetchAllIndicatorsData, {
    refetchOnWindowFocus: false
  });

  const selectedData = indicatorsData?.find(d => d.indicator?.id === selectedIndicator) || null;

  const handleDataUpload = () => {
    refetch();
  };

  // Ensure we have valid data before rendering chart
  const validChartData = selectedData && selectedData.indicator && selectedData.data ? selectedData : null;

  const handleEditDataPoint = (updatedPoint: IndicatorDataPoint) => {
    if (!selectedData) return;
    
    const updatedData = selectedData.data.map(point => 
      point.date === updatedPoint.date ? updatedPoint : point
    );
    
    updateIndicatorData(selectedData.indicator.id, updatedData);
    refetch();
  };

  const handleDeleteDataPoint = (pointToDelete: IndicatorDataPoint) => {
    if (!selectedData) return;
    
    if (confirm('Are you sure you want to delete this data point?')) {
      const updatedData = selectedData.data.filter(point => point.date !== pointToDelete.date);
      updateIndicatorData(selectedData.indicator.id, updatedData);
      refetch();
    }
  };

  const handleEditDescriptionClick = () => {
    if (!selectedData?.indicator) return;
    setEditingDescription(selectedData.indicator.description);
    setIsEditingDescription(true);
  };

  const handleSaveDescription = () => {
    if (!selectedData?.indicator) return;
    
    // Get the current data from localStorage
    const localStorageKey = `presidential_dashboard_indicator-${selectedData.indicator.id}`;
    const storedData = localStorage.getItem(localStorageKey);
    
    if (storedData) {
      // Parse the stored data
      const parsedData = JSON.parse(storedData);
      
      // Update the description while preserving the rest of the indicator data
      const updatedData = {
        ...parsedData,
        data: {
          ...parsedData.data,
          indicator: {
            ...parsedData.data.indicator,
            description: editingDescription
          }
        }
      };
      
      // Save back to localStorage
      localStorage.setItem(localStorageKey, JSON.stringify(updatedData));
      
      // Also update the data points to ensure consistency
      updateIndicatorData(selectedData.indicator.id, selectedData.data);
      
      // Refetch to update the UI
      refetch();
    }
    
    setIsEditingDescription(false);
  };

  const handleCancelEdit = () => {
    setIsEditingDescription(false);
    setEditingDescription('');
  };

  const handleDataSourceChange = (indicatorId: string, useUploadedData: boolean) => {
    setDataSourcePreference(indicatorId, { useUploadedData });
    refetch();
  };

  const formatLastUpdated = (timestamp: string | null) => {
    if (!timestamp) return 'Never updated';
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
      
      if (diffInSeconds < 60) return 'Updated just now';
      if (diffInSeconds < 3600) return `Updated ${Math.floor(diffInSeconds / 60)} minutes ago`;
      if (diffInSeconds < 86400) return `Updated ${Math.floor(diffInSeconds / 3600)} hours ago`;
      if (diffInSeconds < 604800) return `Updated ${Math.floor(diffInSeconds / 86400)} days ago`;
      
      return `Updated on ${date.toLocaleDateString()}`;
    } catch (error) {
      return 'Invalid date';
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <button
            onClick={handleLogout}
            className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-white rounded-lg shadow-md p-4">
              <h2 className="text-lg font-semibold mb-4">Data Sources</h2>
              <div className="space-y-4">
                {economicIndicators.map(indicator => {
                  const preferences = getDataSourcePreferences();
                  const isUsingUploadedData = preferences[indicator.id]?.useUploadedData || false;
                  const lastUpdated = getLastUpdated(indicator.id);
                  
                  return (
                    <div key={indicator.id} className="flex flex-col space-y-2 p-2 hover:bg-gray-50 rounded">
                      <span className="text-sm text-gray-700 font-medium">{indicator.name}</span>
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-xs text-gray-600">
                            {isUsingUploadedData ? 'Using Uploaded Data' : 'Using API Data'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatLastUpdated(lastUpdated)}
                          </span>
                        </div>
                        <button
                          onClick={() => handleDataSourceChange(indicator.id, !isUsingUploadedData)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            isUsingUploadedData ? 'bg-blue-600' : 'bg-gray-200'
                          }`}
                          title={isUsingUploadedData ? 'Switch to API Data' : 'Switch to Uploaded Data'}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              isUsingUploadedData ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center text-sm text-gray-600">
                  <Database className="h-4 w-4 mr-2" />
                  <span>Toggle between FRED API and manually uploaded data</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-4">
              <h2 className="text-lg font-semibold mb-4">Chart Visibility</h2>
              <ChartVisibilityControl
                visibleCharts={visibleCharts}
                setVisibleCharts={setVisibleCharts}
              />
            </div>
          </div>

          <div className="lg:col-span-9 space-y-6">
            <div className="bg-white rounded-lg shadow-md p-4">
              <h2 className="text-lg font-semibold mb-4">API Status</h2>
              <ApiStatusChecker />
            </div>

            <div className="bg-white rounded-lg shadow-md p-4">
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

              {selectedIndicator && selectedData?.indicator && (
                <div className="mb-6">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-md font-semibold">Description</h3>
                    {!isEditingDescription && (
                      <button
                        onClick={handleEditDescriptionClick}
                        className="text-blue-600 hover:text-blue-800"
                        title="Edit description"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  {isEditingDescription ? (
                    <div>
                      <textarea
                        value={editingDescription}
                        onChange={(e) => setEditingDescription(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-2"
                        rows={3}
                      />
                      <div className="flex space-x-2">
                        <button
                          onClick={handleSaveDescription}
                          className="flex items-center px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700"
                        >
                          <Save className="h-4 w-4 mr-1" />
                          Save
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="flex items-center px-3 py-1 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                        >
                          <X className="h-4 w-4 mr-1" />
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-600">{selectedData.indicator.description}</p>
                  )}
                </div>
              )}

              {selectedIndicator ? (
                validChartData ? (
                  <>
                    <div className="h-64 mb-4">
                      <IndicatorChart data={validChartData} />
                    </div>
                    <DataTable 
                      data={validChartData.data} 
                      indicator={validChartData.indicator}
                      isAdmin={true}
                      onEdit={handleEditDataPoint}
                      onDelete={handleDeleteDataPoint}
                    />
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
    </div>
  );
}
