
import React, { useState } from 'react';
import { economicIndicators } from '../data/indicators';
import { IndicatorDataPoint } from '../types';
import { setDataSourcePreference } from '../services/api';

interface DataUploadProps {
  onUpload: (data: IndicatorDataPoint[], indicatorId: string) => void;
}

export default function DataUpload({ onUpload }: DataUploadProps) {
  const [selectedIndicator, setSelectedIndicator] = useState('');
  const [csvContent, setCsvContent] = useState('');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setCsvContent(event.target?.result as string);
    };
    reader.readAsText(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIndicator || !csvContent) return;

    const lines = csvContent.trim().split('\n');
    const data: IndicatorDataPoint[] = lines.slice(1).map(line => {
      const [date, value, president] = line.split(',');
      return {
        date: date.trim(),
        value: parseFloat(value.trim()),
        president: president.trim()
      };
    });

    // Set preference to use uploaded data
    setDataSourcePreference(selectedIndicator, { useUploadedData: true });
    onUpload(data, selectedIndicator);
    setCsvContent('');
    setSelectedIndicator('');
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h2 className="text-lg font-semibold mb-4">Upload Indicator Data</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-2">Select Indicator:</label>
          <select 
            value={selectedIndicator}
            onChange={(e) => setSelectedIndicator(e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="">Select...</option>
            {economicIndicators.map(indicator => (
              <option key={indicator.id} value={indicator.id}>
                {indicator.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block mb-2">Upload CSV (date,value,president):</label>
          <input 
            type="file" 
            accept=".csv"
            onChange={handleFileUpload}
            className="w-full"
          />
        </div>
        <button 
          type="submit"
          disabled={!selectedIndicator || !csvContent}
          className="bg-blue-500 text-white px-4 py-2 rounded disabled:bg-gray-300"
        >
          Upload Data
        </button>
      </form>
    </div>
  );
}
