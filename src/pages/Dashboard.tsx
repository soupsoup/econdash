import React, { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import { fetchAllIndicatorsData, checkForDataUpdates, getLastUpdatedTimestamp } from '../services/api';
import Header from '../components/Header';
import IndicatorCard from '../components/IndicatorCard';
import PresidentialComparison from '../components/PresidentialComparison';
import DataSourceInfo from '../components/DataSourceInfo';
import ApiStatusChecker from '../components/ApiStatusChecker';
import { AlertTriangle } from 'lucide-react';
import ApiErrorNotice from '../components/MockDataNotice';

function Dashboard() {
  const [hasNewData, setHasNewData] = useState(false);
  const [apiErrors, setApiErrors] = useState<Record<string, string>>({});
  const [lastUpdated, setLastUpdated] = useState<string | null>(getLastUpdatedTimestamp());
  
  // Fetch all indicators data
  const { 
    data: indicatorsData, 
    isLoading, 
    refetch,
    error
  } = useQuery('allIndicatorsData', fetchAllIndicatorsData, {
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 60, // 1 hour
    retry: 1, // Reduced retries to avoid excessive API calls
    onSuccess: () => {
      // Update last updated timestamp
      setLastUpdated(getLastUpdatedTimestamp());
      setHasNewData(false);
    },
    onError: (err) => {
      console.error('Error fetching economic data:', err);
      
      // Extract and format error details
      if (err instanceof Error) {
        setApiErrors(prev => ({
          ...prev,
          'Data Fetch Error': err.message
        }));
      } else {
        setApiErrors(prev => ({
          ...prev,
          'Unknown Error': String(err)
        }));
      }
    }
  });
  
  // Check for data updates every 5 minutes
  useEffect(() => {
    const checkUpdates = async () => {
      try {
        const hasUpdates = await checkForDataUpdates();
        setHasNewData(hasUpdates);
      } catch (err) {
        console.error('Error checking for updates:', err);
      }
    };
    
    // Initial check
    checkUpdates();
    
    // Set up interval
    const interval = setInterval(checkUpdates, 1000 * 60 * 5); // 5 minutes
    
    return () => clearInterval(interval);
  }, []);
  
  // Handle refresh button click
  const handleRefresh = () => {
    setApiErrors({});
    refetch();
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        lastUpdated={lastUpdated} 
        hasNewData={hasNewData} 
        onRefresh={handleRefresh} 
      />
      
      <main className="container mx-auto px-4 py-8">
        {Object.keys(apiErrors).length > 0 && <ApiErrorNotice errors={apiErrors} />}
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4 mb-6 flex items-start">
            <AlertTriangle className="h-5 w-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-medium">Error loading economic data</p>
              <p className="text-sm mt-1">There was a problem fetching the latest economic data from the APIs. Please check your API keys and try again.</p>
              
              <p className="text-sm mt-2 font-medium">Error details:</p>
              <div className="text-sm text-red-700 font-mono bg-red-50 p-2 rounded mt-1 border border-red-200 overflow-auto max-h-32">
                {error instanceof Error ? error.message : 'Unknown error'}
              </div>
              
              <button
                onClick={handleRefresh}
                className="mt-3 bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded text-sm transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        )}
        
        {isLoading && !error && (
          <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded-md p-4 mb-6 flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
            <p>Loading economic data from BLS, FRED, and EIA APIs...</p>
          </div>
        )}
        
        {!isLoading && !error && indicatorsData && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {indicatorsData.map(data => (
              <IndicatorCard key={data.indicator.id} data={data} isLoading={false} />
            ))}
          </div>
        )}
        
        {isLoading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {Array.from({ length: 8 }).map((_, index) => (
              <IndicatorCard key={index} data={null as any} isLoading={true} />
            ))}
          </div>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {!isLoading && !error && indicatorsData && indicatorsData.length > 0 && (
            <PresidentialComparison indicatorsData={indicatorsData} />
          )}
          <ApiStatusChecker />
        </div>
        
        <div className="mt-6">
          <DataSourceInfo />
        </div>
      </main>
      
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="container mx-auto px-4 py-6">
          <p className="text-center text-gray-600 text-sm">
            Presidential Economic Dashboard © {new Date().getFullYear()} | 
            Data sourced from BLS, Federal Reserve, and EIA
          </p>
        </div>
      </footer>
    </div>
  );
}

export default Dashboard;