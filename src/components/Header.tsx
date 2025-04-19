import React from 'react';
import { BarChart3, Database } from 'lucide-react';

interface HeaderProps {
  lastUpdated: string | null;
  hasNewData: boolean;
  onRefresh: () => void;
}

const Header: React.FC<HeaderProps> = ({ lastUpdated }) => {
  return (
    <header className="bg-white shadow-md">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center mb-4 md:mb-0">
            <BarChart3 className="h-8 w-8 mr-3 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-800">America Econ</h1>
              <p className="text-gray-600">Tracking the major economic indicators for the United States of America</p>
            </div>
          </div>
          
          <div className="text-sm text-gray-600">
            {lastUpdated ? (
              <span>Last updated: {new Date(lastUpdated).toLocaleDateString()}</span>
            ) : (
              <span>Loading data...</span>
            )}
          </div>
        </div>
        
        <div className="flex items-center justify-center mt-4 bg-blue-50 p-2 rounded-md border border-blue-100">
          <Database className="h-4 w-4 mr-2 text-blue-600" />
          <span className="text-sm text-blue-800">Using economic data from FRED API with local storage for faster loading</span>
        </div>
      </div>
    </header>
  );
};

export default Header;