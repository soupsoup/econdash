import React from 'react';
import { economicIndicators } from '../data/indicators';

interface ChartVisibilityControlProps {
  visibleCharts: string[];
  setVisibleCharts: (charts: string[]) => void;
}

const ChartVisibilityControl: React.FC<ChartVisibilityControlProps> = ({ 
  visibleCharts, 
  setVisibleCharts 
}) => {
  const handleToggle = (indicatorId: string) => {
    if (visibleCharts.includes(indicatorId)) {
      setVisibleCharts(visibleCharts.filter(id => id !== indicatorId));
    } else {
      setVisibleCharts([...visibleCharts, indicatorId]);
    }
  };

  return (
    <div className="space-y-2">
      {economicIndicators.map(indicator => (
        <div key={indicator.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
          <span className="text-sm text-gray-700">{indicator.name}</span>
          <button
            onClick={() => handleToggle(indicator.id)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              visibleCharts.includes(indicator.id) ? 'bg-blue-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                visibleCharts.includes(indicator.id) ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      ))}
    </div>
  );
};

export default ChartVisibilityControl;
