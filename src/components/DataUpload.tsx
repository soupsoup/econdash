import React, { useState } from 'react';
import { economicIndicators } from '../data/indicators';
import { IndicatorDataPoint } from '../types';
import { setDataSourcePreference } from '../services/api';
import { createClient } from '@supabase/supabase-js';

interface DataUploadProps {
  onUpload: (data: IndicatorDataPoint[], indicatorId: string) => void;
}

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

async function uploadIndicatorDataToSupabase(indicatorId: string, data: IndicatorDataPoint[]) {
  // data: array of { date, value, president? }
  console.log('Uploading to Supabase:', { indicatorId, data });
  const rows = data.map((d: IndicatorDataPoint) => ({
    indicator_id: indicatorId,
    date: d.date,
    value: d.value,
    president: d.president || null,
  }));
  const { error, status, data: supabaseData } = await supabase
    .from('indicator_data')
    .upsert(rows, { onConflict: 'indicator_id,date' });
  if (error) {
    console.error('Supabase insert error:', error);
    alert('Failed to upload data to Supabase: ' + error.message);
    return false;
  }
  console.log('Supabase insert success:', { status, supabaseData });
  alert('Data uploaded to Supabase successfully!');
  return true;
}

async function clearIndicatorDataFromSupabase(indicatorId: string) {
  const { error } = await supabase.from('indicator_data').delete().eq('indicator_id', indicatorId);
  if (error) {
    console.error('Error clearing old data from Supabase:', error);
    alert('Failed to clear old data from Supabase: ' + error.message);
    return false;
  }
  return true;
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
    let data: IndicatorDataPoint[];
    
    // Parse based on indicator type
    if (selectedIndicator === 'inflation' || selectedIndicator === 'unemployment') {
      data = lines.slice(1).map(line => {
        const [rawDate, rawValue] = line.split(',');
        const [year, month] = rawDate.trim().split('-');
        const monthNum = new Date(Date.parse(month + " 1, " + year)).getMonth() + 1;
        const formattedDate = `${year}-${monthNum.toString().padStart(2, '0')}-01`;
        const value = parseFloat(rawValue.trim());
        if (isNaN(value)) return undefined;
        return {
          date: formattedDate,
          value
        };
      }).filter((point): point is IndicatorDataPoint => Boolean(point && typeof point.date === 'string' && typeof point.value === 'number'));
    } else if (selectedIndicator === 'umich-consumer-sentiment') {
      data = lines.slice(1).map(line => {
        const [month, year, index] = line.split(',');
        let monthNum: number;
        if (/^\d+$/.test(month.trim())) {
          // Numeric month
          monthNum = parseInt(month.trim(), 10);
        } else {
          // Month name
          monthNum = new Date(Date.parse(month.trim() + ' 1, ' + year.trim())).getMonth() + 1;
        }
        const formattedDate = `${year.trim()}-${monthNum.toString().padStart(2, '0')}-01`;
        const value = parseFloat(index.trim());
        if (isNaN(value)) return undefined;
        return {
          date: formattedDate,
          value
        };
      }).filter((point): point is IndicatorDataPoint => Boolean(point && typeof point.date === 'string' && typeof point.value === 'number'));
    } else {
      data = lines.slice(1).map(line => {
        const [date, value, president] = line.split(',');
        const parsedValue = parseFloat(value?.trim?.() ?? '');
        if (isNaN(parsedValue)) return undefined;
        const obj: IndicatorDataPoint = {
          date: date?.trim?.() ?? '',
          value: parsedValue
        };
        if (typeof president === 'string' && president.trim() !== '') {
          obj.president = president.trim();
        }
        return obj;
      }).filter((point): point is IndicatorDataPoint => Boolean(point && typeof point.date === 'string' && typeof point.value === 'number'));
    }

    // Set preference to use uploaded data
    setDataSourcePreference(selectedIndicator, { useUploadedData: true });
    onUpload(data, selectedIndicator);
    console.log('Uploaded data:', data, 'for indicator:', selectedIndicator);
    setCsvContent('');
    setSelectedIndicator('');

    (async () => {
      if (selectedIndicator === 'umich-consumer-sentiment') {
        await clearIndicatorDataFromSupabase(selectedIndicator);
      }
      await uploadIndicatorDataToSupabase(selectedIndicator, data);
    })();
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
