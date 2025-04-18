
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { CheckCircle, XCircle, AlertTriangle, Clock, Database, RefreshCw, ExternalLink } from 'lucide-react';

interface ApiStatus {
  name: string;
  url: string;
  status: 'checking' | 'up' | 'down' | 'rate-limited' | 'error';
  message?: string;
  errorCode?: string;
  lastChecked?: Date;
}

const ApiStatusChecker: React.FC = () => {
  const [apiStatuses, setApiStatuses] = useState<ApiStatus[]>([
    {
      name: 'FRED API',
      url: '/api/fred/series?series_id=CPIAUCSL',
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

  const [selectedApi, setSelectedApi] = useState<string | null>(null);
  
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
        updated[index] = { 
          ...api, 
          status: 'up',
          lastChecked: new Date()
        };
        return updated;
      });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const errorMessage = error.response?.data?.message || error.message;
        
        setApiStatuses(prev => {
          const updated = [...prev];
          updated[index] = { 
            ...api, 
            status: status === 429 ? 'rate-limited' : 'down',
            message: errorMessage,
            errorCode: status?.toString(),
            lastChecked: new Date()
          };
          return updated;
        });
      }
    }
  };

  const getFixSuggestion = (api: ApiStatus) => {
    switch (api.errorCode) {
      case '429':
        return 'Wait until rate limit resets (usually midnight ET) or request a higher quota';
      case '401':
        return 'Check API key validity and permissions';
      case '403':
        return 'Verify API key and authentication headers';
      case '404':
        return 'Verify the API endpoint URL and parameters';
      case '500':
        return 'API service issue - check service status page or try again later';
      default:
        return 'Check network connection and API configuration';
    }
  };
  
  useEffect(() => {
    apiStatuses.forEach((api, index) => {
      checkApiStatus(api, index);
    });
    checkLocalStorage();
    
    const interval = setInterval(() => {
      apiStatuses.forEach((api, index) => {
        checkApiStatus(api, index);
      });
    }, 300000); // Check every 5 minutes
    
    return () => clearInterval(interval);
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
        return <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    }
  };

  const handleRefreshStatus = (index: number) => {
    const api = apiStatuses[index];
    setApiStatuses(prev => {
      const updated = [...prev];
      updated[index] = { ...api, status: 'checking' };
      return updated;
    });
    checkApiStatus(api, index);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {apiStatuses.map((api, index) => (
          <div 
            key={index} 
            className={`p-4 rounded-lg border ${
              api.status === 'up' ? 'border-green-200 bg-green-50' :
              api.status === 'down' ? 'border-red-200 bg-red-50' :
              api.status === 'rate-limited' ? 'border-amber-200 bg-amber-50' :
              'border-gray-200 bg-gray-50'
            }`}
          >
            <div className="flex justify-between items-start">
              <div className="flex items-start space-x-3">
                <div className="mt-0.5">{getStatusIcon(api.status)}</div>
                <div>
                  <h3 className="font-medium text-gray-800">{api.name}</h3>
                  <button 
                    onClick={() => setSelectedApi(selectedApi === api.name ? null : api.name)}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    {selectedApi === api.name ? 'Hide Details' : 'View Details'}
                  </button>
                </div>
              </div>
              <button 
                onClick={() => handleRefreshStatus(index)}
                className="text-gray-500 hover:text-gray-700"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>

            {selectedApi === api.name && (
              <div className="mt-4 space-y-3 text-sm">
                <div>
                  <p className="font-medium">Endpoint:</p>
                  <p className="text-gray-600 break-all">{api.url}</p>
                </div>
                
                {api.status !== 'up' && (
                  <>
                    <div>
                      <p className="font-medium">Error:</p>
                      <p className="text-red-600">{api.message}</p>
                      {api.errorCode && (
                        <p className="text-gray-500">Code: {api.errorCode}</p>
                      )}
                    </div>
                    <div>
                      <p className="font-medium">How to fix:</p>
                      <p className="text-gray-600">{getFixSuggestion(api)}</p>
                    </div>
                  </>
                )}
                
                {api.lastChecked && (
                  <p className="text-gray-500">
                    Last checked: {api.lastChecked.toLocaleTimeString()}
                  </p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-8 p-4 rounded-lg border border-blue-200 bg-blue-50">
        <div className="flex items-start space-x-3">
          <Database className="h-5 w-5 text-blue-500 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-medium text-gray-800">Local Storage Status</h3>
            <p className="text-sm text-gray-600 mt-1">
              {localStorageInfo.items} items stored
            </p>
            
            <div className="mt-3">
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${(localStorageInfo.used / localStorageInfo.total) * 100}%` }}
                />
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {localStorageInfo.used} KB used of {localStorageInfo.total} KB available
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiStatusChecker;
