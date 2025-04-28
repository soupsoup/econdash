import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import IndicatorCard from '../components/IndicatorCard';
import PresidentialComparison from '../components/PresidentialComparison';
import DataSourceInfo from '../components/DataSourceInfo';
import NextUpdates from '../components/NextUpdates';
import PresidentSchedule from '../components/PresidentSchedule';
import EconomicCalendar from '../components/EconomicCalendar';
import GoldPriceIndicator from '../components/GoldPriceIndicator';
import { useQuery } from 'react-query';
import { fetchAllIndicatorsData, checkForDataUpdates } from '../services/api';
import { AlertTriangle } from 'lucide-react';
import { economicIndicators } from '../data/indicators';
import { IndicatorData } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { BreakingNewsBanner } from '../components/BreakingNewsBanner';

export default function Dashboard() {
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [hasNewData, setHasNewData] = useState(false);
  const [visibleCharts] = useLocalStorage<string[]>('visibleCharts', 
    economicIndicators.map(i => i.id));

  const { data: indicators, isLoading, isError, error, refetch } = useQuery<IndicatorData[]>(
    'allIndicatorsData',
    fetchAllIndicatorsData,
    {
      onSuccess: (data) => {
        if (data && data.length > 0) {
          const timestamp = new Date().toISOString();
          setLastUpdated(timestamp);
          localStorage.setItem('economic_indicator_v3_last_global_update', Date.now().toString());
        }
      },
      refetchOnWindowFocus: true,
      refetchOnMount: true,
      refetchInterval: 1000 * 60 * 30, // Check every 30 minutes
      retry: 3,
      retryDelay: 1000,
      onError: (error) => {
        console.error('Error fetching indicator data:', error);
      }
    }
  );

  useEffect(() => {
    const checkUpdates = async () => {
      try {
        const needsUpdate = await checkForDataUpdates();
        if (needsUpdate) {
          console.log('Data update needed, triggering refetch...');
          setHasNewData(true);
        }
      } catch (error) {
        console.error('Error checking for updates:', error);
      }
    };

    // Check for updates on mount and every 5 minutes
    checkUpdates();
    const interval = setInterval(checkUpdates, 1000 * 60 * 5);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setHasNewData(false);
    refetch();
  };

  // Check if we have any valid data to display
  const hasValidData = indicators && indicators.length > 0;

  return (
    <div className="min-h-screen bg-gray-100">
      <BreakingNewsBanner />
      <Header />
      <main className="container mx-auto px-4 py-8">
        {isError && (
          <div className="mb-8 flex items-center justify-between bg-red-50 p-4 rounded-lg">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <p className="text-red-700">
                Error loading data: {error instanceof Error ? error.message : 'Unknown error'}
              </p>
            </div>
            <button
              onClick={handleRefresh}
              className="px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200"
            >
              Retry
            </button>
          </div>
        )}

        {hasNewData && (
          <div className="mb-8 flex items-center justify-between bg-yellow-50 p-4 rounded-lg">
            <p className="text-yellow-700">New data available!</p>
            <button
              onClick={handleRefresh}
              className="mt-2 px-4 py-2 bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200"
            >
              Refresh Data
            </button>
          </div>
        )}

        <div className="space-y-8">
          {!isLoading && hasValidData && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <GoldPriceIndicator />
                {economicIndicators
                  .filter(indicator => 
                    visibleCharts.includes(indicator.id) && 
                    indicator.id !== 'GOLDAMGBD228NLBM' // Remove FRED gold price indicator
                  )
                  .map(indicator => {
                    const indicatorData = indicators.find(d => d.indicator?.id === indicator.id);
                    return (
                      <IndicatorCard
                        key={indicator.id}
                        data={indicatorData || { indicator, data: [] }}
                        isLoading={false}
                        refetch={refetch}
                      />
                    );
                  })}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <EconomicCalendar />
                <NextUpdates />
              </div>
            </>
          )}
          
          <PresidentSchedule />
          
          {!isLoading && hasValidData && (
            <div className="space-y-8">
              <PresidentialComparison indicatorsData={indicators} />
              <DataSourceInfo />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}