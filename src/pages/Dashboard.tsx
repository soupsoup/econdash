import React, { useState } from 'react';
import Header from '../components/Header';
import IndicatorCard from '../components/IndicatorCard';
import PresidentialComparison from '../components/PresidentialComparison';
import DataSourceInfo from '../components/DataSourceInfo';
import NextUpdates from '../components/NextUpdates';
import { useQuery } from 'react-query';
import { fetchAllIndicatorsData } from '../services/api';
import { AlertTriangle } from 'lucide-react';
import { economicIndicators } from '../data/indicators';
import { IndicatorData } from '../types';

export default function Dashboard() {
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [hasNewData, setHasNewData] = useState(false);

  const { data: indicators, isLoading, isError, error, refetch } = useQuery<IndicatorData[]>(
    'allIndicatorsData',
    fetchAllIndicatorsData,
    {
      onSuccess: (data) => {
        if (data && data.length > 0) {
          const timestamp = new Date().toISOString();
          setLastUpdated(timestamp);
        }
      },
      refetchOnWindowFocus: false
    }
  );

  const handleRefresh = () => {
    setHasNewData(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        lastUpdated={lastUpdated}
        hasNewData={hasNewData}
        onRefresh={handleRefresh}
      />
      
      <main className="container mx-auto px-4 py-8">
        {isLoading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading economic data...</p>
          </div>
        )}

        {isError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
            <div className="flex items-center text-red-800 mb-2">
              <AlertTriangle className="h-5 w-5 mr-2" />
              <h3 className="font-semibold">Error Loading Data</h3>
            </div>
            <p className="text-red-600">{error instanceof Error ? error.message : 'An error occurred while fetching the data.'}</p>
          </div>
        )}

        {!isLoading && !isError && indicators && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {economicIndicators.map(indicator => {
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

            <NextUpdates />
            
            <div className="space-y-8">
              <PresidentialComparison indicatorsData={indicators} />
              <DataSourceInfo />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}