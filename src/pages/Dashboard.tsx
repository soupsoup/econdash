import React, { useState, useEffect } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useQuery } from 'react-query';
import { economicIndicators } from '../data/indicators';
import { fetchAllIndicatorsData, checkForDataUpdates, getLastUpdatedTimestamp } from '../services/api';
import Header from '../components/Header';
import IndicatorCard from '../components/IndicatorCard';
import PresidentialComparison from '../components/PresidentialComparison';
import DataSourceInfo from '../components/DataSourceInfo';

import { AlertTriangle } from 'lucide-react';
import ApiErrorNotice from '../components/MockDataNotice';

import DataUpload from '../components/DataUpload';
import { updateIndicatorData } from '../services/api';

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
  const { 
    data: indicatorsData, 
    isLoading, 
    refetch,
    error
  } = useQuery('allIndicatorsData', fetchAllIndicatorsData, {
    onSuccess: (data) => {
      console.log('Loaded indicators:', data?.length);
      console.log('Visible charts:', visibleCharts);
    },
    refetchOnWindowFocus: false,
    staleTime: Infinity,
    retry: 2,
    enabled: true,
    cacheTime: Infinity,
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
            {indicatorsData
              .filter(data => {
                if (!data?.indicator?.id) return false;
                return visibleCharts.length === 0 || visibleCharts.includes(data.indicator.id);
              })
              .map(data => (
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

        <div className="grid grid-cols-1 gap-6">
          {!isLoading && !error && indicatorsData && indicatorsData.length > 0 && (
            <PresidentialComparison indicatorsData={indicatorsData} />
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
            Data sourced from BLS, Federal Reserve, and EIA
          </p>
        </div>
      </footer>
    </div>
  );
}

export default Dashboard;