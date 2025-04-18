import React from 'react';
import { ExternalLink, Database, RefreshCw, Key } from 'lucide-react';

const DataSourceInfo: React.FC = () => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold text-gray-800 flex items-center mb-4">
        <Database className="h-5 w-5 mr-2 text-blue-600" />
        Data Sources
      </h2>
      
      <div className="space-y-4">
        <div className="border-b pb-4">
          <h3 className="font-medium text-gray-800 mb-2">Bureau of Labor Statistics (BLS)</h3>
          <p className="text-sm text-gray-600 mb-2">
            The BLS is a unit of the United States Department of Labor that serves as the principal fact-finding agency for the U.S. government in the field of labor economics and statistics.
          </p>
          <div className="flex items-center text-xs text-gray-500 mb-2">
            <Key className="h-3 w-3 mr-1" />
            <span>API access configured</span>
          </div>
          <a 
            href="https://www.bls.gov/data/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 flex items-center text-sm"
          >
            <span className="mr-1">Visit BLS Data</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
        
        <div className="border-b pb-4">
          <h3 className="font-medium text-gray-800 mb-2">Federal Reserve Economic Data (FRED)</h3>
          <p className="text-sm text-gray-600 mb-2">
            FRED is an online database consisting of hundreds of thousands of economic data time series from scores of national, international, public, and private sources.
          </p>
          <div className="flex items-center text-xs text-gray-500 mb-2">
            <Key className="h-3 w-3 mr-1" />
            <span>API access configured</span>
          </div>
          <a 
            href="https://fred.stlouisfed.org/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 flex items-center text-sm"
          >
            <span className="mr-1">Visit FRED</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
        
        <div>
          <h3 className="font-medium text-gray-800 mb-2">U.S. Energy Information Administration (EIA)</h3>
          <p className="text-sm text-gray-600 mb-2">
            The EIA collects, analyzes, and disseminates independent and impartial energy information to promote sound policymaking, efficient markets, and public understanding.
          </p>
          <div className="flex items-center text-xs text-gray-500 mb-2">
            <Key className="h-3 w-3 mr-1" />
            <span>API access configured</span>
          </div>
          <a 
            href="https://www.eia.gov/tools/api/index.php" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 flex items-center text-sm"
          >
            <span className="mr-1">Visit EIA Data</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
      
      <div className="mt-6 bg-blue-50 p-4 rounded-md border border-blue-100">
        <div className="flex items-start">
          <RefreshCw className="h-5 w-5 text-blue-600 mr-3 mt-0.5" />
          <div>
            <h3 className="font-medium text-gray-800 mb-1">Data Update Schedule</h3>
            <p className="text-sm text-gray-600">
              This dashboard checks for new data daily from all sources. Different economic indicators are updated at different frequencies:
            </p>
            <ul className="text-sm text-gray-600 mt-2 space-y-1 list-disc list-inside">
              <li>Daily: Stock market indices</li>
              <li>Weekly: Gas prices</li>
              <li>Monthly: Unemployment, inflation, job creation</li>
              <li>Quarterly: GDP growth, federal debt</li>
              <li>Yearly: Median household income</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataSourceInfo;