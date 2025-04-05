import React from 'react';
import { BarChart3, TrendingUp, AlertCircle, Database, Trash2 } from 'lucide-react';
import { getCurrentPresident } from '../data/presidents';
import { clearAllStoredData } from '../services/api';

interface HeaderProps {
  lastUpdated: string | null;
  hasNewData: boolean;
  onRefresh: () => void;
}

const Header: React.FC<HeaderProps> = ({ lastUpdated, hasNewData, onRefresh }) => {
  const currentPresident = getCurrentPresident();
  
  const handleClearData = () => {
    if (window.confirm('Are you sure you want to clear all stored data? This will force a refresh from the APIs.')) {
      clearAllStoredData();
      onRefresh();
    }
  };
  
  return (
    <header className="bg-white shadow-md">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center mb-4 md:mb-0">
            <BarChart3 className="h-8 w-8 mr-3 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Presidential Economic Dashboard</h1>
              <p className="text-gray-600">Tracking economic performance under {currentPresident.name}</p>
            </div>
          </div>
          
          <div className="flex items-center">
            {hasNewData && (
              <div className="flex items-center mr-4 text-amber-600">
                <AlertCircle className="h-5 w-5 mr-1" />
                <span className="text-sm">New data available</span>
              </div>
            )}
            
            <div className="text-sm text-gray-600 mr-4">
              {lastUpdated ? (
                <span>Last updated: {new Date(lastUpdated).toLocaleDateString()}</span>
              ) : (
                <span>Loading data...</span>
              )}
            </div>
            
            <div className="flex space-x-2">
              <button 
                onClick={onRefresh}
                className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Refresh Data
              </button>
              
              <button 
                onClick={handleClearData}
                className="flex items-center bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-2 rounded-md transition-colors"
                title="Clear stored data and refresh from APIs"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-center mt-4 bg-blue-50 p-2 rounded-md border border-blue-100">
          <Database className="h-4 w-4 mr-2 text-blue-600" />
          <span className="text-sm text-blue-800">Using economic data from BLS, FRED, and EIA APIs with local storage for faster loading</span>
        </div>
      </div>
    </header>
  );
};

export default Header;