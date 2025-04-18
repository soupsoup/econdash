import React, { useState, useEffect } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useQuery } from 'react-query';
import { economicIndicators } from '../data/indicators';
import { fetchAllIndicatorsData, checkForDataUpdates, getLastUpdatedTimestamp, clearAllStoredData, LAST_UPDATED_KEY } from '../services/api';
import Header from '../components/Header';
import IndicatorCard from '../components/IndicatorCard';
import PresidentialComparison from '../components/PresidentialComparison';
import DataSourceInfo from '../components/DataSourceInfo';

import { AlertTriangle } from 'lucide-react';
import ApiErrorNotice from '../components/MockDataNotice';

import DataUpload from '../components/DataUpload';
import { updateIndicatorData } from '../services/api';
import { IndicatorDataPoint } from '../types';

function Dashboard() {
  const [hasNewData, setHasNewData] = useState(false);
  const [apiErrors, setApiErrors] = useState<Record<string, string>>({});
  const [lastUpdated, setLastUpdated] = useState<string | null>(getLastUpdatedTimestamp());
  const [visibleCharts, setVisibleCharts] = useLocalStorage<string[]>('visibleCharts', 
    economicIndicators.map(i => i.id)
  );

  useEffect(() => {
    if (!visibleCharts?.length) {
      setVisibleCharts(economicIndicators.map(i => i.id));
    }
  }, []);


  const handleDataUpload = (data: IndicatorDataPoint[], indicatorId: string) => {
    try {
      updateIndicatorData(indicatorId, data);
      refetch();
    } catch (error) {
      console.error('Error uploading data:', error);
      setApiErrors(prev => ({
        ...prev,
        'Data Upload Error': error instanceof Error ? error.message : String(error)
      }));
    }
  };

  // Fetch all indicators data
  const { data: indicators, isLoading, isError, error, refetch } = useQuery(
    ['indicators'],
    async () => {
      console.log('Fetching fresh data from FRED API...');
      const data = await fetchAllIndicatorsData();
      console.log('Received data:', data);
      // Update last updated timestamp after successful fetch
      localStorage.setItem(LAST_UPDATED_KEY, Date.now().toString());
      setLastUpdated(getLastUpdatedTimestamp());
      setHasNewData(false);
      return data;
    },
    {
      staleTime: 0, // Always consider data stale
      cacheTime: 1000 * 60 * 5, // Cache for 5 minutes only
      refetchOnWindowFocus: true,
      refetchOnMount: true,
      retry: 3
    }
  );

  // Check for data updates every 5 minutes and force refresh if needed
  useEffect(() => {
    // Force clear cache and refresh on mount
    const forceRefresh = async () => {
      console.log('Forcing refresh of data...');
      clearAllStoredData();
      await refetch();
    };
    
    forceRefresh();
    
    const checkUpdates = async () => {
      try {
        const hasUpdates = await checkForDataUpdates();
        if (hasUpdates) {
          console.log('Updates available, refreshing data...');
          clearAllStoredData();
          await refetch();
        }
      } catch (err) {
        console.error('Error checking for updates:', err);
      }
    };

    // Set up interval for subsequent checks
    const interval = setInterval(checkUpdates, 1000 * 60 * 5); // 5 minutes

    return () => clearInterval(interval);
  }, [refetch]);

  // Handle refresh button click
  const handleRefresh = async () => {
    try {
      await refetch();
      setHasNewData(false);
      setApiErrors({});
    } catch (err) {
      console.error('Error refreshing data:', err);
      if (err instanceof Error) {
        setApiErrors(prev => ({
          ...prev,
          'Refresh Error': err.message
        }));
      }
    }
  };

  const handleClearData = () => {
    if (window.confirm('Are you sure you want to clear all stored data? This will force a refresh from the APIs.')) {
      clearAllStoredData();
      handleRefresh();
    }
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

        {isError && (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4 mb-6 flex items-start">
            <AlertTriangle className="h-5 w-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-medium">Error loading economic data</p>
              <p className="text-sm mt-1">There was a problem fetching the latest economic data. Please try again later or contact support if the issue persists.</p>

              <button
                onClick={handleRefresh}
                className="mt-3 bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded text-sm transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {isLoading && !isError && (
          <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded-md p-4 mb-6 flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
            <p>Loading economic data from FRED API...</p>
          </div>
        )}

        {!isLoading && !isError && indicators && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {indicators
              .filter(data => {
                if (!data?.indicator?.id) return false;
                return visibleCharts.length === 0 || visibleCharts.includes(data.indicator.id);
              })
              .map(data => (
              <IndicatorCard
                key={data.indicator.id}
                data={data}
                isLoading={false}
                refetch={refetch}
              />
            ))}
          </div>
        )}

        {isLoading && !isError && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {Array.from({ length: 8 }).map((_, index) => (
              <IndicatorCard
                key={index}
                data={null}
                isLoading={true}
                refetch={refetch}
              />
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6">
          {!isLoading && !isError && indicators && indicators.length > 0 && (
            <PresidentialComparison indicatorsData={indicators} />
          )}
        </div>

        <div className="mt-6">
          <DataSourceInfo />
        </div>
      </main>

      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="container mx-auto px-4 py-6">
          <p className="text-center text-gray-600 text-sm">
            Presidential Economic Dashboard © {new Date().getFullYear()} | 
            Data sourced from Federal Reserve Economic Data (FRED)
          </p>
        </div>
      </footer>
    </div>
  );
}

export default Dashboard;