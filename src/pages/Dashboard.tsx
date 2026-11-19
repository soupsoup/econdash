import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import IndicatorCard from '../components/IndicatorCard';
import PresidentialComparison from '../components/PresidentialComparison';
import DataSourceInfo from '../components/DataSourceInfo';
import NextUpdates from '../components/NextUpdates';
import PresidentSchedule from '../components/PresidentSchedule';
import { useQuery } from 'react-query';
import { fetchAllIndicatorsData, checkForDataUpdates } from '../services/api';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { economicIndicators } from '../data/indicators';
import { IndicatorData } from '../types';
import { useVisibleCharts } from '../hooks/useVisibleCharts';
import { BreakingNewsBanner } from '../components/BreakingNewsBanner';
import FrontPage, { FRONT_PAGE_IDS } from '../components/FrontPage';
import LatestPost from '../components/LatestPost';

const INDICATOR_GROUPS = [
  { title: 'More Indicators', note: 'Growth, inflation, debt, income', ids: (id: string) => !FRONT_PAGE_IDS.includes(id) },
];

export default function Dashboard() {
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [visibleCharts] = useVisibleCharts();

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
    <div className="min-h-screen bg-paper">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <BreakingNewsBanner />
        <div className="mb-8" />
        
        {isRefreshing && (
          <div className="fixed top-4 right-4 bg-ink text-paper font-mono text-xs uppercase tracking-wide px-4 py-2 shadow-md flex items-center space-x-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Updating data...</span>
          </div>
        )}

        {isError && (
          <div className="border-y-2 border-accent text-accent px-1 py-3 relative mb-6">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              <span>Error loading data: {error instanceof Error ? error.message : 'Unknown error'}</span>
            </div>
          </div>
        )}

        <div className="space-y-12">
          {!isLoading && hasValidData ? (
            <>
              <FrontPage indicators={indicators} />

              <LatestPost />

              {INDICATOR_GROUPS.map(group => {
                const items = economicIndicators.filter(
                  indicator =>
                    group.ids(indicator.id) &&
                    visibleCharts.includes(indicator.id) &&
                    indicator.id !== 'GOLDAMGBD228NLBM' // Remove FRED gold price indicator
                );
                if (items.length === 0) return null;
                return (
                  <section key={group.title}>
                    <div className="flex items-baseline justify-between border-b-4 border-double border-ink pb-2 mb-6">
                      <h2 className="section-title">{group.title}</h2>
                      <span className="eyebrow hidden sm:inline">{group.note}</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-4">
                      {items.map(indicator => {
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
                  </section>
                );
              })}
            </>
          ) : (
            !isLoading && (
              <div className="text-center py-12">
                <h2 className="text-2xl font-semibold text-ink mb-4">Welcome to The Economy</h2>
                <p className="text-ink-soft mb-6">
                  Your dashboard for tracking key economic indicators and presidential impacts.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="border-t-2 border-ink pt-4">
                    <h3 className="text-lg font-semibold mb-2">Economic Updates</h3>
                    <p className="text-ink-soft mb-4">Stay informed with the latest economic news and analysis.</p>
                    <a href="/posts" className="text-accent hover:underline">View Updates →</a>
                  </div>
                  <div className="border-t-2 border-ink pt-4">
                    <h3 className="text-lg font-semibold mb-2">Presidential Impact</h3>
                    <p className="text-ink-soft mb-4">Explore how different presidential administrations have affected the economy.</p>
                    <a href="/indicator/unemployment" className="text-accent hover:underline">View Analysis →</a>
                  </div>
                  <div className="border-t-2 border-ink pt-4">
                    <h3 className="text-lg font-semibold mb-2">Economic Calendar</h3>
                    <p className="text-ink-soft mb-4">Track upcoming economic events and data releases.</p>
                    <a href="/calendar" className="text-accent hover:underline">View Calendar →</a>
                  </div>
                </div>
              </div>
            )
          )}
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-10">
            <NextUpdates />
            <PresidentSchedule />
          </div>
          
          {!isLoading && hasValidData && (
            <div className="space-y-12">
              <PresidentialComparison indicatorsData={indicators} />
              <DataSourceInfo />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}