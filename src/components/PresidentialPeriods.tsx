import React from 'react';
import { IndicatorData } from '../types';
import { presidents } from '../data/presidents';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface PresidentialPeriodsProps {
  data: IndicatorData;
}

const PresidentialPeriods: React.FC<PresidentialPeriodsProps> = ({ data }) => {
  const { indicator, data: dataPoints } = data;
  
  // Calculate statistics for each president
  const presidentialStats = presidents.map(president => {
    // Create a unique ID for each presidency using the term start date
    const presidencyId = `${president.name}-${president.term.start}`;
    
    // Filter data points that fall within this president's term
    const presidentData = dataPoints
      .filter(point => {
        const pointDate = new Date(point.date);
        const startDate = new Date(president.term.start);
        const endDate = president.term.end ? new Date(president.term.end) : new Date();
        return pointDate >= startDate && pointDate < endDate;
      })
      .filter(point => !isNaN(point.value)) // Filter out any NaN values
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()); // Sort by date
    
    if (presidentData.length === 0) {
      return { president, stats: null, presidencyId };
    }
    
    // Calculate statistics
    const values = presidentData.map(point => point.value);
    const average = values.reduce((sum, val) => sum + val, 0) / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);
    
    // Calculate start and end values
    const startValue = presidentData[0].value;
    const endValue = presidentData[presidentData.length - 1].value;
    const netChange = endValue - startValue;
    const percentChange = ((endValue - startValue) / startValue) * 100;
    
    // Calculate annualized change
    const startDate = new Date(presidentData[0].date);
    const endDate = new Date(presidentData[presidentData.length - 1].date);
    const yearsDiff = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
    const annualizedChange = yearsDiff > 0 ? (Math.pow((endValue / startValue), 1 / yearsDiff) - 1) * 100 : 0;
    
    return {
      president,
      stats: {
        average,
        min,
        max,
        startValue,
        endValue,
        netChange,
        percentChange,
        annualizedChange,
        dataPoints: presidentData.length
      },
      presidencyId
    };
  }).filter(item => item.stats !== null);
  
  // Sort by performance (considering whether higher is better)
  presidentialStats.sort((a, b) => {
    if (!a.stats || !b.stats) return 0;
    
    return indicator.higherIsBetter
      ? b.stats.percentChange - a.stats.percentChange
      : a.stats.percentChange - b.stats.percentChange;
  });
  
  // Format value based on indicator type
  const formatValue = (value: number) => {
    if (indicator.id === 'job-creation') {
      // For job creation, show in millions with 3 decimal places
      return (value / 1000).toFixed(3);
    } else if (indicator.id === 'stock-market') {
      // For S&P 500, show with commas and 2 decimal places
      return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    } else {
      // For other indicators, use the default formatting with decimals
      return value.toFixed(2);
    }
  };
  
  // Format change value based on indicator type
  const formatChange = (value: number) => {
    if (indicator.id === 'job-creation') {
      // For job creation, show change in millions with 3 decimal places
      return (value / 1000).toFixed(3);
    } else if (indicator.id === 'stock-market') {
      // For S&P 500, show with commas and 2 decimal places
      return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    } else {
      // For other indicators, use the default formatting with decimals
      return value.toFixed(2);
    }
  };
  
  return (
    <div className="space-y-6">
      {presidentialStats.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No data available for this time period
        </div>
      ) : (
        presidentialStats.map(({ president, stats, presidencyId }) => {
          if (!stats) return null;
          
          const isPositiveChange = indicator.higherIsBetter 
            ? stats.netChange > 0 
            : stats.netChange < 0;
          
          return (
            <div key={presidencyId} className="border rounded-lg overflow-hidden">
              <div 
                className="p-4 flex justify-between items-center"
                style={{ backgroundColor: `${president.color}15` }}
              >
                <div>
                  <h3 className="font-bold text-lg">{president.name}</h3>
                  <p className="text-sm text-gray-600">
                    {president.term.start} to {president.term.end || 'Present'}
                  </p>
                </div>
                <div className={`flex items-center ${isPositiveChange ? 'text-green-600' : 'text-red-600'}`}>
                  {isPositiveChange ? (
                    <TrendingUp className="h-5 w-5 mr-2" />
                  ) : (
                    <TrendingDown className="h-5 w-5 mr-2" />
                  )}
                  <span className="font-bold">
                    {stats.percentChange > 0 ? '+' : ''}
                    {stats.percentChange.toFixed(2)}%
                  </span>
                </div>
              </div>
              
              <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Start Value</p>
                  <p className="font-medium">{formatValue(stats.startValue)} {indicator.unit}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">End Value</p>
                  <p className="font-medium">{formatValue(stats.endValue)} {indicator.unit}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Net Change</p>
                  <p className={`font-medium ${isPositiveChange ? 'text-green-600' : 'text-red-600'}`}>
                    {stats.netChange > 0 ? '+' : ''}
                    {formatChange(stats.netChange)} {indicator.unit}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Annualized Change</p>
                  <p className={`font-medium ${isPositiveChange ? 'text-green-600' : 'text-red-600'}`}>
                    {stats.annualizedChange > 0 ? '+' : ''}
                    {stats.annualizedChange.toFixed(2)}%
                  </p>
                </div>
              </div>
              
              <div className="p-4 bg-gray-50 grid grid-cols-3 gap-4 border-t">
                <div>
                  <p className="text-sm text-gray-600">Average</p>
                  <p className="font-medium">{formatValue(stats.average)} {indicator.unit}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Minimum</p>
                  <p className="font-medium">{formatValue(stats.min)} {indicator.unit}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Maximum</p>
                  <p className="font-medium">{formatValue(stats.max)} {indicator.unit}</p>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

export default PresidentialPeriods;