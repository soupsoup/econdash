
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
  const [apiStatuses, setApiStatuses] = useState<ApiStatus[]>([
    {
      name: 'FRED API',
      url: 'https://api.stlouisfed.org/fred/series?series_id=CPIAUCSL&api_key=08baf631b4523fb0d66722ab2d546a88',
      status: 'checking'
    },
    {
      name: 'BLS API',
      url: 'https://api.bls.gov/publicAPI/v2/timeseries/data/LNS14000000',
      status: 'checking'
    },
    {
      name: 'EIA API',
      url: 'https://api.eia.gov/v2/total-energy/data/?api_key=WU9DIO3Pc3R6vrqHlObPJgpmKdEgE7ZSvhMm1LJ4',
      status: 'checking'
    }
  ]);
  
  const [localStorageInfo, setLocalStorageInfo] = useState({
    used: 0,
    total: 0,
    items: 0
  });
  
  const checkLocalStorage = () => {
    try {
      let used = 0;
      let items = 0;
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('presidential_dashboard_')) {
          const value = localStorage.getItem(key) || '';
          used += key.length + value.length;
          items++;
        }
      }
      
      const usedKB = Math.round(used / 1024);
      const totalKB = 5 * 1024; // 5MB typical browser limit
      
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
      await axios({
        method: api.name === 'BLS API' ? 'post' : 'get',
        url: api.url,
        timeout: 5000,
        headers: api.name === 'BLS API' ? {
          'Content-Type': 'application/json',
          'Registrationkey': 'ce15238949e14526b9b13c2ff4beabfc'
        } : undefined
      });
      
      setApiStatuses(prev => {
        const updated = [...prev];
        updated[index] = { ...api, status: 'up' };
        return updated;
      });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        if (status === 429) {
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
          setApiStatuses(prev => {
            const updated = [...prev];
            updated[index] = { 
              ...api, 
              status: 'down',
              message: error.message
            };
            return updated;
          });
        }
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
          </div>
        </div>
      ))}
      
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
  );
};

export default ApiStatusChecker;
