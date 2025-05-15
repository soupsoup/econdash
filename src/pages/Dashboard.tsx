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

interface DashboardProps {
  indicatorsData: IndicatorData[];
}

export default function Dashboard({ indicatorsData }: DashboardProps) {
  console.log('Rendering Dashboard', { indicatorsData });
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
      refetchOnWindowFocus: false,
      refetchOnMount: true,
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

    // Check for updates on mount only
    checkUpdates();
  }, [refetch]);

  // Check if we have any valid data to display
  const hasValidData = indicators && indicators.length > 0;

  // Minimal render for debugging
  return (
    <div>Test: Dashboard is rendering</div>
  );
}