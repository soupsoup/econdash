
import React from 'react';
import { Switch } from 'lucide-react';
import { DataSourcePreference, getDataSourcePreferences, setDataSourcePreference } from '../services/api';

interface DataSourceSelectorProps {
  indicatorId: string;
  onPreferenceChange: () => void;
}

const DataSourceSelector: React.FC<DataSourceSelectorProps> = ({ indicatorId, onPreferenceChange }) => {
  const preferences = getDataSourcePreferences();
  const preference = preferences[indicatorId] || { useUploadedData: false };

  const handleToggle = () => {
    setDataSourcePreference(indicatorId, {
      useUploadedData: !preference.useUploadedData
    });
    onPreferenceChange();
  };

  return (
    <div className="flex items-center space-x-2 p-2">
      <button
        onClick={handleToggle}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          preference.useUploadedData ? 'bg-blue-600' : 'bg-gray-200'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            preference.useUploadedData ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
      <span className="text-sm text-gray-700">
        {preference.useUploadedData ? 'Using Uploaded Data' : 'Using API Data'}
      </span>
    </div>
  );
};

export default DataSourceSelector;
