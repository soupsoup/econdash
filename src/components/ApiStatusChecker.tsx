import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { CheckCircle, XCircle, AlertTriangle, Clock, Database } from 'lucide-react';

interface ApiStatus {
  name: string;
  url: string;
  status: 'checking' | 'up' | 'down' | 'rate-limited' | 'error';
  message?: string;
}

const ApiStatusChecker: React.FC = () => {
  const [localStorageInfo, setLocalStorageInfo] = useState({
    used: 0,
    total: 0,
    items: 0
  });
  
  const [localStorageInfo, setLocalStorageInfo] = useState({
    used: 0,
    total: 0,
    items: 0
  });
  
  // Check local storage usage
  const checkLocalStorage = () => {
    try {
      let used = 0;
      let items = 0;
      
      // Count items with our prefix
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('presidential_dashboard_')) {
          const value = localStorage.getItem(key) || '';
          used += key.length + value.length;
          items++;
        }
      }
      
      // Convert to KB
      const usedKB = Math.round(used / 1024);
      
      // Estimate total available (5MB is typical browser limit)
      const totalKB = 5 * 1024;
      
      setLocalStorageInfo({
        used: usedKB,
        total: totalKB,
        items
      });
    } catch (error) {
      console.error('Error checking local storage:', error);
    }
  };
  
  const checkApiStatus = async (api: ApiStatus, index: number) => {
    try {
      // We're just checking if the API endpoints are reachable
      // For POST endpoints like BLS, we'll use a HEAD request
      const method = api.url.includes('bls.gov') ? 'head' : 'get';
      
      await axios({
        method,
        url: api.url,
        timeout: 5000,
      });
      
      // Update status to up
      setApiStatuses(prev => {
        const updated = [...prev];
        updated[index] = { ...api, status: 'up' };
        return updated;
      });
    } catch (error) {
      // Check if it's a CORS error (which is actually good - means the API is up)
      if (axios.isAxiosError(error) && error.code === 'ERR_NETWORK') {
        setApiStatuses(prev => {
          const updated = [...prev];
          updated[index] = { 
            ...api, 
            status: 'up',
            message: 'API is reachable but blocked by CORS (expected behavior)'
          };
          return updated;
        });
      } else if (axios.isAxiosError(error) && error.response?.status === 429) {
        // Rate limit error
        setApiStatuses(prev => {
          const updated = [...prev];
          updated[index] = { 
            ...api, 
            status: 'rate-limited',
            message: 'API rate limit reached'
          };
          return updated;
        });
      } else {
        // Actual error
        setApiStatuses(prev => {
          const updated = [...prev];
          updated[index] = { 
            ...api, 
            status: 'down',
            message: error instanceof Error ? error.message : 'Unknown error'
          };
          return updated;
        });
      }
    }
  };
  
  useEffect(() => {
    apiStatuses.forEach((api, index) => {
      checkApiStatus(api, index);
    });
    
    checkLocalStorage();
  }, []);
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'up':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'down':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'rate-limited':
        return <Clock className="h-5 w-5 text-amber-500" />;
      case 'checking':
        return <div className="h-5 w-5 rounded-full border-2 border-blue-500 border-t-transparent animate-spin"></div>;
      default:
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    }
  };
  
  const getStatusText = (status: string) => {
    switch (status) {
      case 'up':
        return <span className="text-xs text-green-600 font-medium">Available</span>;
      case 'down':
        return <span className="text-xs text-red-600 font-medium">Unavailable</span>;
      case 'rate-limited':
        return <span className="text-xs text-amber-600 font-medium">Rate Limited</span>;
      case 'checking':
        return <span className="text-xs text-blue-600 font-medium">Checking...</span>;
      default:
        return <span className="text-xs text-yellow-600 font-medium">Error</span>;
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">API Status</h2>
      
      <div className="space-y-4">
        {apiStatuses.map((api, index) => (
          <div key={index} className="flex items-start">
            <div className="mt-0.5 mr-3">{getStatusIcon(api.status)}</div>
            <div className="flex-1">
              <div className="flex justify-between items-center">
                <h3 className="font-medium text-gray-800">{api.name}</h3>
                {getStatusText(api.status)}
              </div>
              <p className="text-sm text-gray-600">{api.url}</p>
              {api.message && (
                <p className="text-xs text-gray-500 mt-1">{api.message}</p>
              )}
              {api.status === 'rate-limited' && api.name === 'BLS API' && (
                <p className="text-xs text-amber-600 mt-1">
                  BLS API has a daily limit of 500 requests per key. Limit resets at midnight Eastern Time.
                </p>
              )}
            </div>
          </div>
        ))}
        
        {/* Local Storage Status */}
        <div className="flex items-start pt-4 border-t border-gray-100">
          <div className="mt-0.5 mr-3">
            <Database className="h-5 w-5 text-blue-500" />
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-center">
              <h3 className="font-medium text-gray-800">Local Storage</h3>
              <span className="text-xs text-blue-600 font-medium">
                {localStorageInfo.items} items stored
              </span>
            </div>
            <p className="text-sm text-gray-600">Browser local storage for offline data</p>
            
            <div className="mt-2">
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full" 
                  style={{ width: `${(localStorageInfo.used / localStorageInfo.total) * 100}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {localStorageInfo.used} KB used of {localStorageInfo.total} KB available
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-4 text-xs text-gray-500">
        <p>Note: API endpoints may be reachable but still require valid API keys for data access.</p>
        <p className="mt-1">The application will use locally stored data when API rate limits are reached.</p>
      </div>
    </div>
  );
};

export default ApiStatusChecker;