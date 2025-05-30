import React, { useState } from 'react';
import { IndicatorData } from '../types';
import { presidents } from '../data/presidents';
import { BarChart, TrendingUp, TrendingDown } from 'lucide-react';

interface PresidentialComparisonProps {
  indicatorsData: IndicatorData[];
}

const PresidentialComparison: React.FC<PresidentialComparisonProps> = ({ indicatorsData }) => {
  const [selectedIndicator, setSelectedIndicator] = useState<string>(indicatorsData[0]?.indicator.id || '');
  
  if (indicatorsData.length === 0) {
    return <div className="text-center py-8">Loading comparison data...</div>;
  }
  
  const indicatorData = indicatorsData.find(data => data.indicator.id === selectedIndicator);
  
  if (!indicatorData) {
    return null;
  }
  
  // Calculate average values for each president
  const presidentialAverages = presidents.map(president => {
    // Use term start date to create a unique identifier for each presidency
    const presidencyId = `${president.name}-${president.term.start}`;
    
    // Filter data points that fall within this president's term
    const presidentData = indicatorData.data.filter(point => {
      const pointDate = new Date(point.date);
      const startDate = new Date(president.term.start);
      const endDate = president.term.end ? new Date(president.term.end) : new Date();
      return pointDate >= startDate && pointDate < endDate;
    });
    
    if (presidentData.length === 0) {
      return { president, average: null, presidencyId };
    }
    
    const sum = presidentData.reduce((acc, point) => acc + point.value, 0);
    const average = sum / presidentData.length;
    
    return { president, average, presidencyId };
  }).filter(item => item.average !== null);
  
  // Sort by average value (considering whether higher is better)
  presidentialAverages.sort((a, b) => {
    if (a.average === null) return 1;
    if (b.average === null) return -1;
    
    return indicatorData.indicator.higherIsBetter 
      ? b.average - a.average 
      : a.average - b.average;
  });
  
  // Find the best and worst presidents for this indicator
  const bestPresident = presidentialAverages[0];
  const worstPresident = presidentialAverages[presidentialAverages.length - 1];
  
  // Calculate the maximum value for the chart
  const maxValue = Math.max(...presidentialAverages.map(item => item.average || 0));
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h2 className="text-xl font-bold text-gray-800 flex items-center">
          <BarChart className="h-5 w-5 mr-2 text-blue-600" />
          Presidential Comparison
        </h2>
        
        <select
          value={selectedIndicator}
          onChange={(e) => setSelectedIndicator(e.target.value)}
          className="w-full sm:w-auto border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {indicatorsData.map(data => (
            <option key={data.indicator.id} value={data.indicator.id}>
              {data.indicator.name}
            </option>
          ))}
        </select>
      </div>
      
      <div className="space-y-4">
        {presidentialAverages.map(({ president, average, presidencyId }) => (
          <div key={presidencyId} className="flex items-center">
            <div className="w-32 text-sm font-medium">
              {president.name}
              <span className="text-xs text-gray-500 block">
                {president.term.start.substring(0, 4)}
                {president.term.end ? `-${president.term.end.substring(0, 4)}` : '-Present'}
              </span>
            </div>
            <div className="flex-1">
              <div className="relative h-8 flex items-center">
                <div 
                  className="absolute h-6 rounded-r-sm" 
                  style={{ 
                    width: `${(average || 0) / maxValue * 100}%`, 
                    backgroundColor: president.color,
                    opacity: 0.8
                  }}
                ></div>
                <span className="relative ml-2 text-sm font-medium">
                  {indicatorData.indicator.id === 'job-creation' ? (average / 1000).toFixed(3) : average?.toFixed(2)} {indicatorData.indicator.unit}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-green-50 p-4 rounded-md border border-green-100">
          <div className="flex items-center text-green-700 mb-2">
            <TrendingUp className="h-4 w-4 mr-2" />
            <h3 className="font-semibold">Best Performance</h3>
          </div>
          <p className="text-sm text-gray-700">
            <span className="font-medium">{bestPresident?.president.name}</span> had the 
            {indicatorData.indicator.higherIsBetter ? ' highest ' : ' lowest '}
            average {indicatorData.indicator.name.toLowerCase()} at 
            <span className="font-medium"> {bestPresident?.average?.toFixed(2)} {indicatorData.indicator.unit}</span>
          </p>
        </div>
        
        <div className="bg-red-50 p-4 rounded-md border border-red-100">
          <div className="flex items-center text-red-700 mb-2">
            <TrendingDown className="h-4 w-4 mr-2" />
            <h3 className="font-semibold">Worst Performance</h3>
          </div>
          <p className="text-sm text-gray-700">
            <span className="font-medium">{worstPresident?.president.name}</span> had the 
            {indicatorData.indicator.higherIsBetter ? ' lowest ' : ' highest '}
            average {indicatorData.indicator.name.toLowerCase()} at 
            <span className="font-medium"> {worstPresident?.average?.toFixed(2)} {indicatorData.indicator.unit}</span>
          </p>
        </div>
      </div>
      
      <div className="mt-4 text-xs text-gray-500">
        Note: Averages are calculated based on available data during each presidential term.
      </div>
    </div>
  );
};

export default PresidentialComparison;