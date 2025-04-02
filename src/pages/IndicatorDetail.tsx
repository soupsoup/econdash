import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import { format, subYears, parseISO } from 'date-fns';
import { fetchIndicatorData, getLastUpdatedTimestamp } from '../services/api';
import { ArrowLeft, Download, Calendar, Filter, AlertTriangle, ExternalLink } from 'lucide-react';
import DetailChart from '../components/DetailChart';
import PresidentialPeriods from '../components/PresidentialPeriods';
import DataTable from '../components/DataTable';
import ApiErrorNotice from '../components/MockDataNotice';

const IndicatorDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [timeRange, setTimeRange] = useState<number>(10); // Default to 10 years
  const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart');
  const [apiErrors, setApiErrors] = useState<Record<string, string>>({});
  const [lastUpdated, setLastUpdated] = useState<string | null>(getLastUpdatedTimestamp());

  // Ensure all useMemo hooks are in the same place to maintain consistent order
  const csvData = useMemo(() => {
    if (!data?.dataPoints) return [];
    return data.dataPoints.map(point => ({
      Date: point.date,
      Value: point.value
    }));
  }, [data]);

  // Fetch indicator data
  const { data: indicatorData, isLoading, error, refetch } = useQuery(
    ['indicatorData', id],
    async () => {
      console.log('Fetching indicator data for ID:', id);
      const data = await fetchIndicatorData(id || '');
      console.log('Received data:', data);
      return data;
    },
    {
      enabled: !!id,
      refetchOnWindowFocus: false,
      retry: 2,
      retryDelay: 1000,
      onSuccess: () => {
        // Update last updated timestamp
        setLastUpdated(getLastUpdatedTimestamp());
      },
      onError: (err) => {
        console.error('Error fetching indicator data:', err);

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
    }
  );

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
    console.error('IndicatorDetail Error:', error);
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Error Loading Data</h2>
          <p className="text-gray-600 mb-4">
            We couldn't retrieve the economic data for this indicator from our data sources.
          </p>
          <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-6 text-left">
            <p className="text-sm text-red-800 font-medium">Error details:</p>
            <p className="text-sm text-red-700 font-mono mt-1 overflow-auto max-h-48">
              {error instanceof Error ? error.message : 'Unknown error'}
            </p>
            <p className="text-sm text-red-600 mt-2">
              Indicator ID: {id}
            </p>
          </div>
          <div className="flex space-x-3 justify-center">
            <button
              onClick={() => navigate('/')}
              className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </button>
            <button
              onClick={() => refetch()}
              className="flex items-center bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!indicatorData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-800 mb-2">Indicator Not Found</h2>
          <p className="text-gray-600 mb-4">The requested economic indicator could not be found.</p>
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

  const { indicator, data: dataPoints } = indicatorData;

  // Filter data based on selected time range
  const cutoffDate = subYears(new Date(), timeRange);
  const filteredData = dataPoints.filter(point => parseISO(point.date) >= cutoffDate);

  // Get current value
  const currentValue = dataPoints[dataPoints.length - 1]?.value || 0;

  // Calculate average, min, and max values
  const average = filteredData.length > 0 
    ? filteredData.reduce((sum, point) => sum + point.value, 0) / filteredData.length 
    : 0;

  const minValue = filteredData.length > 0 
    ? Math.min(...filteredData.map(point => point.value)) 
    : 0;

  const maxValue = filteredData.length > 0 
    ? Math.max(...filteredData.map(point => point.value)) 
    : 0;

  // Calculate month-to-month job growth for job creation indicator
  const processedData = useMemo(() => {
    if (indicator.id === 'job-creation') {
      // For job creation, calculate month-to-month changes
      return filteredData.map((point, index, array) => {
        if (index === 0) {
          return { ...point, originalValue: point.value, value: 0 };
        }
        const previousValue = array[index - 1].value;
        const monthlyChange = point.value - previousValue;
        return { 
          ...point, 
          originalValue: point.value, // Keep the original value
          value: monthlyChange // Set value to the monthly change
        };
      }).slice(1); // Remove first item with zero change
    }
    return filteredData;
  }, [filteredData, indicator.id]);

  // Format value based on indicator type
  const formatValue = (value: number, useOriginal = false) => {
    if (indicator.id === 'job-creation') {
      if (useOriginal) {
        // Show total jobs for original value
        return Math.round(value).toLocaleString();
      }
      // Show monthly change with + or - sign
      const prefix = value > 0 ? '+' : '';
      return `${prefix}${Math.round(value).toLocaleString()}`;
    } else {
      // For other indicators, use the default formatting with decimals
      return value.toFixed(2);
    }
  };

  // Export data as CSV
  const exportCSV = () => {
    const headers = ['Date', `Value (${indicator.unit})`, 'President'];
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
    link.setAttribute('download', `${indicator.id}-data.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
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
              <p className="text-gray-600">{indicator.description}</p>
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

        {/* Key metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-md p-4">
            <p className="text-sm text-gray-600 mb-1">Current Value</p>
            <p className="text-2xl font-bold text-gray-800">
              {formatValue(currentValue)} {indicator.unit}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-4">
            <p className="text-sm text-gray-600 mb-1">Average</p>
            <p className="text-2xl font-bold text-gray-800">
              {formatValue(average)} {indicator.unit}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-4">
            <p className="text-sm text-gray-600 mb-1">Minimum</p>
            <p className="text-2xl font-bold text-gray-800">
              {formatValue(minValue)} {indicator.unit}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-4">
            <p className="text-sm text-gray-600 mb-1">Maximum</p>
            <p className="text-2xl font-bold text-gray-800">
              {formatValue(maxValue)} {indicator.unit}
            </p>
          </div>
        </div>

        {/* Time range selector */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-8">
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

        {/* Chart or Table */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-8">
          <div className="flex items-center mb-4">
            <Filter className="h-5 w-5 text-blue-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-800">
              {indicator.name} Data ({filteredData.length} data points)
            </h2>
          </div>

          <div className={viewMode === 'chart' ? 'block' : 'hidden'}>
            <div className="h-96">
              <DetailChart data={indicatorData} filteredData={filteredData} />
            </div>
          </div>

          <div className={viewMode === 'table' ? 'block' : 'hidden'}>
            <DataTable data={filteredData} indicator={indicator} />
          </div>
        </div>

        {/* Presidential periods */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Performance by Presidential Term</h2>
          <PresidentialPeriods data={indicatorData} />
        </div>

        {/* Source information */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Data Source Information</h2>
          <p className="text-gray-600 mb-4">
            This data is sourced from {indicator.source} and is updated {indicator.frequency}.
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
            Data sourced from BLS, Federal Reserve, and EIA
          </p>
        </div>
      </footer>
    </div>
  );
};

export default IndicatorDetail;