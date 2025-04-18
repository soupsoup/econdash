
import React from 'react';
import { useQuery } from 'react-query';
import Header from '../components/Header';
import IndicatorCard from '../components/IndicatorCard';
import PresidentialComparison from '../components/PresidentialComparison';
import DataSourceInfo from '../components/DataSourceInfo';
import { fetchAllIndicatorsData } from '../services/api';

function Dashboard() {
  const { data: indicatorsData, isLoading, error, refetch } = useQuery(
    'allIndicatorsData',
    fetchAllIndicatorsData,
    {
      refetchOnWindowFocus: false
    }
  );

  const hasNewData = false; // Implement this based on your needs

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        lastUpdated={indicatorsData?.[0]?.lastUpdated || null}
        hasNewData={hasNewData}
        onRefresh={() => refetch()}
      />
      
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {indicatorsData?.map(data => (
            <IndicatorCard
              key={data.indicator.id}
              data={data}
              isLoading={isLoading}
              refetch={refetch}
            />
          ))}
        </div>

        {indicatorsData && indicatorsData.length > 0 && (
          <div className="space-y-8">
            <PresidentialComparison indicatorsData={indicatorsData} />
            <DataSourceInfo />
          </div>
        )}
      </main>
    </div>
  );
}

export default Dashboard;
