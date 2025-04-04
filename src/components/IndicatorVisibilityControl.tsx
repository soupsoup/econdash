
import React, { useEffect, useState } from 'react';
import { economicIndicators } from '../data/indicators';

interface IndicatorVisibility {
  [key: string]: boolean;
}

interface IndicatorVisibilityControlProps {
  onVisibilityChange?: () => void;
}

export default function IndicatorVisibilityControl({ onVisibilityChange }: IndicatorVisibilityControlProps) {
  const [visibilitySettings, setVisibilitySettings] = useState<IndicatorVisibility>({});
  const [pendingSettings, setPendingSettings] = useState<IndicatorVisibility>({});
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    // Load current settings
    const stored = localStorage.getItem('indicator-visibility');
    if (stored) {
      const settings = JSON.parse(stored);
      setVisibilitySettings(settings);
      setPendingSettings(settings);
    } else {
      // Initialize all indicators as visible
      const initial = economicIndicators.reduce((acc, indicator) => {
        acc[indicator.id] = true;
        return acc;
      }, {} as IndicatorVisibility);
      setVisibilitySettings(initial);
      setPendingSettings(initial);
      localStorage.setItem('indicator-visibility', JSON.stringify(initial));
    }
  }, []);

  const toggleVisibility = (indicatorId: string) => {
    setPendingSettings(prev => ({
      ...prev,
      [indicatorId]: !prev[indicatorId]
    }));
  };

  const applyChanges = () => {
    setVisibilitySettings(pendingSettings);
    localStorage.setItem('indicator-visibility', JSON.stringify(pendingSettings));
    // Force a refresh by triggering a custom event
    window.dispatchEvent(new Event('visibilitychange'));
    if (onVisibilityChange) {
      onVisibilityChange();
    }
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h2 className="text-lg font-semibold mb-4">Dashboard Indicators Visibility</h2>
      <div className="space-y-2">
        {economicIndicators.map(indicator => (
          <div key={indicator.id} className="flex items-center">
            <input
              type="checkbox"
              id={indicator.id}
              checked={pendingSettings[indicator.id] ?? true}
              onChange={() => toggleVisibility(indicator.id)}
              className="mr-2"
            />
            <label htmlFor={indicator.id}>{indicator.name}</label>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-4">
        <button
          onClick={applyChanges}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
          Apply Changes
        </button>
        {showSuccess && (
          <span className="text-green-600 animate-fade-in">
            Changes applied successfully!
          </span>
        )}
      </div>
    </div>
  );
}
