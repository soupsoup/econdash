import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, ArrowDownRight, ExternalLink, Maximize2, AlertTriangle } from 'lucide-react';
import { IndicatorData } from '../types';
import DetailChart from './DetailChart'; // Changed import

interface IndicatorCardProps {
  data: IndicatorData | null;
  isLoading: boolean;
  refetch: () => void; 
}

const IndicatorCard: React.FC<IndicatorCardProps> = ({ data, isLoading, refetch }) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-full mb-6"></div>
        <div className="h-40 bg-gray-200 rounded w-full"></div>
      </div>
    );
  }

  // If data is null, show a loading state
  if (!data) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Loading...</h3>
            <p className="text-sm text-gray-600">Fetching indicator data</p>
          </div>
        </div>

        <div className="flex items-center justify-center h-40 bg-gray-50 rounded-md">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  const { indicator, data: dataPoints } = data;

  // Check if we have data
  if (!dataPoints || dataPoints.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">{indicator.name}</h3>
            <p className="text-sm text-gray-600">{indicator.description}</p>
          </div>
        </div>

        <div className="flex items-center justify-center h-40 bg-red-50 rounded-md border border-red-100">
          <div className="text-center p-4">
            <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-sm text-red-800">No data available</p>
          </div>
        </div>

        <div className="mt-4 text-xs text-gray-500 flex justify-between items-center">
          <div>
            <span>Source: {indicator.source}</span>
          </div>
          <Link 
            to={`/indicator/${indicator.id}`}
            className="text-blue-600 hover:text-blue-800 flex items-center text-xs"
          >
            <span className="mr-1">Details</span>
            <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    );
  }

  // Get current and previous values for comparison
  let currentValue: number | undefined;
  let previousValue: number | undefined;

  if (indicator.id === 'monthly-inflation' && dataPoints.length >= 2) {
    // Calculate month-over-month percentage change for monthly-inflation only
    const currentCPI = dataPoints[0].value;
    const previousCPI = dataPoints[1].value;
    currentValue = ((currentCPI - previousCPI) / previousCPI) * 100;
    
    // Calculate previous month's change for comparison
    if (dataPoints.length >= 3) {
      const twoPeriodsCPI = dataPoints[2].value;
      previousValue = ((previousCPI - twoPeriodsCPI) / twoPeriodsCPI) * 100;
    }
  } else if (indicator.id === 'cpi' && dataPoints.length >= 2) {
    // For CPI, use the most recent (last) value
    currentValue = dataPoints[dataPoints.length - 1]?.value;
    previousValue = dataPoints[dataPoints.length - 2]?.value;
  } else {
    currentValue = dataPoints[0]?.value;
    previousValue = dataPoints[1]?.value;
  }

  // Calculate change
  const change = currentValue && previousValue ? currentValue - previousValue : 0;

  // Determine if change is positive (based on whether higher is better for this indicator)
  const isPositiveChange = indicator.higherIsBetter ? change > 0 : change < 0;

  // Format the current value based on the indicator type
  const formatValue = (value: number | undefined) => {
    if (value === undefined) return "N/A";

    if (indicator.id === 'job-creation') {
      // For employment numbers, show in millions with 3 decimal places
      return (value / 1000).toFixed(3);
    } else if (indicator.id === 'monthly-inflation' || indicator.id === 'cpi') {
      // For inflation indicators, show percentage with one decimal place
      return `${value.toFixed(1)}%`;
    } else if (indicator.id === 'stock-market') {
      // For S&P 500, show with 2 decimal places
      return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    } else {
      // For other indicators, use the default formatting
      return value.toLocaleString();
    }
  };

  // Format the change value based on the indicator type
  const formatChange = (changeValue: number) => {
    if (indicator.id === 'job-creation') {
      // For employment changes, show in millions with 3 decimal places
      const changeInMillions = Math.abs(changeValue / 1000).toFixed(3);
      return changeValue >= 0 ? `+${changeInMillions}` : `-${changeInMillions}`;
    } else if (indicator.id === 'monthly-inflation' || indicator.id === 'cpi') {
      // For inflation indicators, show percentage point change with one decimal
      const formattedChange = Math.abs(changeValue).toFixed(1);
      return `${changeValue >= 0 ? '+' : '-'}${formattedChange} pp`;
    } else {
      // For other indicators, show with 1 decimal place
      return Math.abs(changeValue).toFixed(1);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">{indicator.name}</h3>
          <p className="text-sm text-gray-600">{indicator.description}</p>
        </div>
        <div className="flex space-x-2">
          <Link 
            to={`/indicator/${indicator.id}`}
            className="text-blue-600 hover:text-blue-800 flex items-center text-sm"
            title="View detailed data"
          >
            <Maximize2 className="h-4 w-4" />
          </Link>
          <a 
            href={indicator.sourceUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 flex items-center text-sm"
            title="View source data"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </div>

      <div className="flex items-baseline mb-6">
        <span className="text-3xl font-bold mr-2">
          {formatValue(currentValue)}
        </span>

        {change !== 0 && previousValue && (
          <div className={`flex items-center text-sm ${isPositiveChange ? 'text-green-600' : 'text-red-600'}`}>
            {isPositiveChange ? (
              <ArrowUpRight className="h-4 w-4 mr-1" />
            ) : (
              <ArrowDownRight className="h-4 w-4 mr-1" />
            )}
            <span>
              {formatChange(change)}
            </span>
          </div>
        )}
      </div>

      <div className="h-32"> {/* Height adjusted to 32 */}
        <DetailChart data={data} filteredData={data?.data} /> {/* Added filteredData prop */}
      </div>

      <div className="mt-4 text-xs text-gray-500 flex justify-between items-center">
        <div>
          <span>Updated {indicator.frequency}</span>
          <span className="mx-2">•</span>
          <span>Source: {indicator.source}</span>
        </div>
        <Link 
          to={`/indicator/${indicator.id}`}
          className="text-blue-600 hover:text-blue-800 flex items-center text-xs"
        >
          <span className="mr-1">Details</span>
          <ArrowUpRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
};

export default IndicatorCard;