import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import { format, subYears } from 'date-fns';
import { fetchIndicatorData, getLastUpdatedTimestamp } from '../services/api';
import { ArrowLeft, Download, Calendar, Filter, AlertTriangle, ExternalLink, Edit2, Save, X } from 'lucide-react';
import DetailChart from '../components/DetailChart';
import PresidentialPeriods from '../components/PresidentialPeriods';
import DataTable from '../components/DataTable';
import ApiErrorNotice from '../components/MockDataNotice';
import { EconomicIndicator } from '../types';

const IndicatorDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [apiErrors, setApiErrors] = useState<Record<string, string>>({});
  const [lastUpdated, setLastUpdated] = useState<string | null>(getLastUpdatedTimestamp(id || ''));
  const [timeRange, setTimeRange] = useState<number>(10);
  const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart');
  const [isEditing, setIsEditing] = useState(false);
  const [editedDescription, setEditedDescription] = useState('');

  // Add state for admin status (you might want to replace this with proper auth)
  const [isAdmin] = useState(true);

  // Only read the saved data source info from localStorage
  const editedSourceInfo = localStorage.getItem(`indicator-source-info-${id}`);

  const { data: indicatorData = { indicator: { id: '', name: '', description: '', unit: '', source: 'fred', sourceUrl: '', frequency: 'monthly', higherIsBetter: false, seriesId: '', transform: 'none' } as EconomicIndicator, data: [], source: 'api' }, isLoading, error, refetch } = useQuery(
    ['indicatorData', id],
    async () => {
      console.log('Starting fetch for indicator:', id);
      console.log('Current local storage state:', localStorage.getItem(`presidential_dashboard_indicator-${id}`));
      try {
        const data = await fetchIndicatorData(id || '');
        console.log('Indicator data fetch result:', {
          hasData: !!data,
          dataPoints: data?.data?.length,
          indicator: data?.indicator,
          firstPoint: data?.data?.[0],
          lastPoint: data?.data?.[data?.data?.length - 1]
        });
        return data;
      } catch (err) {
        console.error('Error fetching indicator data:', err);
        throw err;
      }
    },
    {
      enabled: !!id,
      refetchOnWindowFocus: false,
      retry: 2,
      retryDelay: 1000,
      onSuccess: () => {
        setLastUpdated(getLastUpdatedTimestamp(id || ''));
      },
      onError: (err) => {
        console.error('Error fetching indicator data:', err);
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
    }
  );

  // Get indicator after indicatorData is defined
  const indicator = indicatorData.indicator;

  // Calculate cutoff date
  const cutoffDate = subYears(new Date(), timeRange);
  const minDate = new Date('2005-06-30');
  const filteredData = indicatorData.data.filter(point => {
    const pointDate = new Date(point.date);
    return pointDate >= cutoffDate && pointDate >= minDate;
  });

  // Create memoized derived data
  const {
    currentValue,
    average,
    minValue,
    maxValue,
    processedData
  } = useMemo(() => {
    let current = 0;
    let avg = 0;
    let min = Infinity;
    let max = -Infinity;
    let processed = filteredData;

    if (indicatorData.indicator?.id === 'monthly-inflation' || indicatorData.indicator?.id === 'cpi') {
      // For monthly inflation and CPI, use the raw value for display
      processed = filteredData.map(point => ({
        ...point,
        value: point.value // Keep the raw value
      }));

      if (processed.length > 0) {
        current = processed[0].value;
      }
    } else {
      // For other indicators, use the raw values
      if (processed.length > 0) {
        current = processed[0].value;
      }
    }

    // Calculate statistics from the processed values
    const values = processed.map(point => point.value).filter(val => !isNaN(val));
    if (values.length > 0) {
      avg = values.reduce((sum, val) => sum + val, 0) / values.length;
      min = Math.min(...values);
      max = Math.max(...values);
    }

    return {
      currentValue: current,
      average: avg,
      minValue: min,
      maxValue: max,
      processedData: processed
    };
  }, [filteredData, indicatorData.indicator?.id]);

  // Create memoized CSV data
  const csvData = useMemo(() => {
    if (indicatorData.indicator?.id === 'monthly-inflation') {
      // For monthly inflation, export the raw CPI values
      return filteredData.map(point => ({
        Date: point.date,
        Value: point.value,
        President: point.president
      }));
    }
    return filteredData.map(point => ({
      Date: point.date,
      Value: point.value,
      President: point.president
    }));
  }, [filteredData, indicatorData.indicator?.id]);

  const formatValue = (value: number) => {
    if (indicatorData.indicator?.id === 'job-creation') {
      // For employment numbers, show in millions with 3 decimal places
      const valueInMillions = value / 1000;
      return valueInMillions.toFixed(3);
    } else if (indicatorData.indicator?.id === 'monthly-inflation') {
      // For CPI, show the raw value with 2 decimal places
      return value.toFixed(2);
    } else {
      return value.toFixed(2);
    }
  };

  const exportCSV = () => {
    const headers = ['Date', `Value (${indicatorData.indicator?.unit})`, 'President'];
    const csvContent = [
      headers.join(','),
      ...filteredData.map(point => 
        `${point.date},${point.value},${point.president}`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${indicatorData.indicator?.id}-data.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleEditClick = () => {
    setEditedDescription(indicatorData.indicator.description);
    setIsEditing(true);
  };

  const handleSaveClick = () => {
    // Here you would typically make an API call to save the changes
    // For now, we'll just update it in local storage
    const storedData = localStorage.getItem(`presidential_dashboard_indicator-${id}`);
    if (storedData) {
      const data = JSON.parse(storedData);
      data.indicator.description = editedDescription;
      localStorage.setItem(`presidential_dashboard_indicator-${id}`, JSON.stringify(data));
      refetch();
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedDescription('');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-8 bg-gray-200 rounded w-64 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-48"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Error Loading Data</h2>
          <p className="text-gray-600 mb-4">
            We couldn't retrieve the economic data for this indicator.
          </p>
          <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-6 text-left">
            <p className="text-sm text-red-800 font-medium">Error details:</p>
            <p className="text-sm text-red-700 font-mono mt-1 overflow-auto max-h-48">
              {error instanceof Error ? error.message : 'Unknown error'}
            </p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="flex items-center mx-auto bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-md">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <button
                onClick={() => navigate('/')}
                className="flex items-center text-blue-600 hover:text-blue-800 mb-4 md:mb-0"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </button>
              <h1 className="text-2xl font-bold text-gray-800 mt-2">{indicator.name}</h1>
              <div className="relative">
                {isEditing ? (
                  <div className="mt-2">
                    <textarea
                      value={editedDescription}
                      onChange={(e) => setEditedDescription(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                    />
                    <div className="mt-2 flex space-x-2">
                      <button
                        onClick={handleSaveClick}
                        className="flex items-center px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700"
                      >
                        <Save className="h-4 w-4 mr-1" />
                        Save
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="flex items-center px-3 py-1 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start">
                    <p className="text-gray-600">{indicator.description}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-3 mt-4 md:mt-0">
              <div className="text-sm text-gray-600">
                {lastUpdated ? (
                  <span>Last updated: {new Date(lastUpdated).toLocaleDateString()}</span>
                ) : (
                  <span>No update information</span>
                )}
              </div>
              <button
                onClick={exportCSV}
                className="flex items-center bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-md transition-colors text-sm"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {Object.keys(apiErrors).length > 0 && <ApiErrorNotice errors={apiErrors} />}

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
            <div className="flex items-center mb-4 sm:mb-0">
              <Calendar className="h-5 w-5 text-blue-600 mr-2" />
              <h2 className="text-lg font-semibold text-gray-800">Time Range</h2>
            </div>

            <div className="flex space-x-2">
              <button
                onClick={() => setViewMode('chart')}
                className={`px-3 py-1 rounded-md text-sm ${
                  viewMode === 'chart'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
              >
                Chart
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1 rounded-md text-sm ${
                  viewMode === 'table'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
              >
                Table
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {[1, 5, 10, 20, 30].map(years => (
              <button
                key={years}
                onClick={() => setTimeRange(years)}
                className={`px-3 py-1 rounded-md text-sm ${
                  timeRange === years
                    ? 'bg-blue-100 text-blue-800 border border-blue-300'
                    : 'bg-gray-100 text-gray-800 border border-gray-200 hover:bg-gray-200'
                }`}
              >
                {years === 1 ? 'Last year' : `Last ${years} years`}
              </button>
            ))}
          </div>
        </div>

        {/* Chart view */}
        {viewMode === 'chart' && (
          <>
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="h-[400px]">
                <DetailChart data={indicatorData} filteredData={processedData} />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Presidential Performance</h2>
              <PresidentialPeriods data={indicatorData} />
            </div>
          </>
        )}

        {/* Table view */}
        {viewMode === 'table' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <DataTable data={processedData} indicator={indicatorData.indicator} />
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Data Source Information</h2>
          <p className="text-gray-600 mb-4">
            {editedSourceInfo || `This data is sourced from ${indicator.source} and is updated ${indicator.frequency}.`}
          </p>
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              <span>Source: {indicator.source}</span>
              <span className="mx-2">•</span>
              <span>Updated: {indicator.frequency}</span>
            </div>
            <a 
              href={indicator.sourceUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center text-blue-600 hover:text-blue-800"
            >
              <span className="mr-2">Visit official source</span>
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
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
};

export default IndicatorDetail;
