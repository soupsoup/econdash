import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, ArrowDownRight, ExternalLink, Maximize2, AlertTriangle } from 'lucide-react';
import { IndicatorData } from '../types';
import IndicatorChart from './IndicatorChart';

import DataSourceSelector from './DataSourceSelector';


interface IndicatorCardProps {
  data: IndicatorData | null;
  isLoading: boolean;
  refetch: () => void; // Added refetch function
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
  const currentValue = dataPoints[dataPoints.length - 1]?.value;
  const previousValue = dataPoints[dataPoints.length - 2]?.value;

  // Calculate change
  const change = currentValue - (previousValue || 0);
  const percentChange = previousValue ? (change / previousValue) * 100 : 0;

  // Determine if change is positive (based on whether higher is better for this indicator)
  const isPositiveChange = indicator.higherIsBetter ? change > 0 : change < 0;

  // Format the current value based on the indicator type
  const formatValue = (value: number | undefined) => {
    if (!value && value !== 0) return "N/A";

    if (indicator.id === 'job-creation') {
      // For job creation, show whole numbers with commas
      return value.toLocaleString();
    } else {
      // For other indicators, use the default formatting
      return value.toLocaleString();
    }
  };

  // Format the change value based on the indicator type
  const formatChange = (changeValue: number) => {
    if (indicator.id === 'job-creation') {
      // For job creation, show whole numbers with commas
      return Math.abs(changeValue).toLocaleString();
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
      <DataSourceSelector indicatorId={indicator.id} onPreferenceChange={refetch} /> {/* Added data source selector */}
      <div className="flex items-baseline mb-6">
        <span className="text-3xl font-bold mr-2">
          {formatValue(currentValue)} {indicator.unit}
        </span>

        {change !== 0 && previousValue && (
          <div className={`flex items-center text-sm ${isPositiveChange ? 'text-green-600' : 'text-red-600'}`}>
            {isPositiveChange ? (
              <ArrowUpRight className="h-4 w-4 mr-1" />
            ) : (
              <ArrowDownRight className="h-4 w-4 mr-1" />
            )}
            <span>{formatChange(change)} ({Math.abs(percentChange).toFixed(1)}%)</span>
          </div>
        )}
      </div>

      <div className="h-40">
        <IndicatorChart data={data} />
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