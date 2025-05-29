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
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { economicIndicators } from '../data/indicators';
import { IndicatorData } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { BreakingNewsBanner } from '../components/BreakingNewsBanner';
import LatestPost from '../components/LatestPost';

export default function Dashboard() {
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
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
        setIsRefreshing(false);
      },
      refetchOnWindowFocus: true,
      refetchOnMount: true,
      refetchInterval: 1000 * 60 * 15, // Check every 15 minutes
      retry: 3,
      retryDelay: 1000,
      onError: (error) => {
        console.error('Error fetching indicator data:', error);
        setIsRefreshing(false);
      }
    }
  );

  useEffect(() => {
    const checkUpdates = async () => {
      try {
        const needsUpdate = await checkForDataUpdates();
        if (needsUpdate) {
          console.log('Data update needed, triggering refetch...');
          setIsRefreshing(true);
          refetch();
        }
      } catch (error) {
        console.error('Error checking for updates:', error);
      }
    };

    // Check for updates on mount and every 5 minutes
    checkUpdates();
    const interval = setInterval(checkUpdates, 1000 * 60 * 5);
    return () => clearInterval(interval);
  }, [refetch]);

  // Check if we have any valid data to display
  const hasValidData = indicators && indicators.length > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <BreakingNewsBanner />
        <div className="mt-6">
          <LatestPost />
        </div>
        <div className="mb-8" />
        
        {isRefreshing && (
          <div className="fixed top-4 right-4 bg-blue-100 text-blue-800 px-4 py-2 rounded-lg shadow-md flex items-center space-x-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Updating data...</span>
          </div>
        )}

        {isError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              <span>Error loading data: {error instanceof Error ? error.message : 'Unknown error'}</span>
            </div>
          </div>
        )}

        <div className="space-y-8">
          {!isLoading && hasValidData ? (
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
                        data={indicatorData || { indicator, data: [], source: 'api' }}
                        isLoading={isLoading || isRefreshing}
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
          ) : (
            !isLoading && (
              <div className="text-center py-12">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Welcome to America Econ</h2>
                <p className="text-gray-600 mb-6">
                  Your dashboard for tracking key economic indicators and presidential impacts.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-2">Economic Updates</h3>
                    <p className="text-gray-600 mb-4">Stay informed with the latest economic news and analysis.</p>
                    <a href="/posts" className="text-blue-600 hover:text-blue-800">View Updates →</a>
                  </div>
                  <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-2">Presidential Impact</h3>
                    <p className="text-gray-600 mb-4">Explore how different presidential administrations have affected the economy.</p>
                    <a href="/indicator/unemployment" className="text-blue-600 hover:text-blue-800">View Analysis →</a>
                  </div>
                  <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-2">Economic Calendar</h3>
                    <p className="text-gray-600 mb-4">Track upcoming economic events and data releases.</p>
                    <a href="/calendar" className="text-blue-600 hover:text-blue-800">View Calendar →</a>
                  </div>
                </div>
              </div>
            )
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