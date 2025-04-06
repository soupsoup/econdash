
import React, { useState } from 'react';
import { economicIndicators } from '../data/indicators';

interface ChartVisibilityControlProps {
  visibleCharts: string[];
  onVisibilityChange: (chartIds: string[]) => void;
}

const ChartVisibilityControl: React.FC<ChartVisibilityControlProps> = ({
  visibleCharts,
  onVisibilityChange,
}) => {
  const [saved, setSaved] = useState(false);
  const [selectedCharts, setSelectedCharts] = useState(visibleCharts);

  const handleToggleChart = (indicatorId: string) => {
    const newSelection = selectedCharts.includes(indicatorId)
      ? selectedCharts.filter(id => id !== indicatorId)
      : [...selectedCharts, indicatorId];
    setSelectedCharts(newSelection);
    setSaved(false);
  };

  const handleSave = () => {
    onVisibilityChange(selectedCharts);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
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
              checked={selectedCharts.includes(indicator.id)}
              onChange={() => handleToggleChart(indicator.id)}
              className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
            <label htmlFor={`chart-${indicator.id}`} className="ml-2 text-sm text-gray-700">
              {indicator.name}
            </label>
          </div>
        ))}
      </div>
      <div className="flex items-center space-x-3">
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Save Changes
        </button>
        {saved && (
          <span className="text-green-600 text-sm">
            Changes saved successfully!
          </span>
        )}
      </div>
    </div>
  );
};

export default ChartVisibilityControl;
