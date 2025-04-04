
import React, { useEffect, useState } from 'react';
import { economicIndicators } from '../data/indicators';

interface IndicatorVisibility {
  [key: string]: boolean;
}

export default function IndicatorVisibilityControl() {
  const [visibilitySettings, setVisibilitySettings] = useState<IndicatorVisibility>({});

  useEffect(() => {
    // Load current settings
    const stored = localStorage.getItem('indicator-visibility');
    if (stored) {
      setVisibilitySettings(JSON.parse(stored));
    } else {
      // Initialize all indicators as visible
      const initial = economicIndicators.reduce((acc, indicator) => {
        acc[indicator.id] = true;
        return acc;
      }, {} as IndicatorVisibility);
      setVisibilitySettings(initial);
      localStorage.setItem('indicator-visibility', JSON.stringify(initial));
    }
  }, []);

  const toggleVisibility = (indicatorId: string) => {
    const newSettings = {
      ...visibilitySettings,
      [indicatorId]: !visibilitySettings[indicatorId]
    };
    setVisibilitySettings(newSettings);
    localStorage.setItem('indicator-visibility', JSON.stringify(newSettings));
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
              checked={visibilitySettings[indicator.id] ?? true}
              onChange={() => toggleVisibility(indicator.id)}
              className="mr-2"
            />
            <label htmlFor={indicator.id}>{indicator.name}</label>
          </div>
        ))}
      </div>
    </div>
  );
}
