
import React from 'react';
import { economicIndicators } from '../data/indicators';

interface ChartVisibilityControlProps {
  visibleCharts: string[];
  onVisibilityChange: (chartIds: string[]) => void;
}

const ChartVisibilityControl: React.FC<ChartVisibilityControlProps> = ({
  visibleCharts,
  onVisibilityChange,
}) => {
  const handleToggleChart = (indicatorId: string) => {
    const newVisibleCharts = visibleCharts.includes(indicatorId)
      ? visibleCharts.filter(id => id !== indicatorId)
      : [...visibleCharts, indicatorId];
    onVisibilityChange(newVisibleCharts);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold mb-4">Chart Visibility</h2>
      <div className="space-y-2">
        {economicIndicators.map(indicator => (
          <div key={indicator.id} className="flex items-center">
            <input
              type="checkbox"
              id={`chart-${indicator.id}`}
              checked={visibleCharts.includes(indicator.id)}
              onChange={() => handleToggleChart(indicator.id)}
              className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
            <label htmlFor={`chart-${indicator.id}`} className="ml-2 text-sm text-gray-700">
              {indicator.name}
            </label>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChartVisibilityControl;
