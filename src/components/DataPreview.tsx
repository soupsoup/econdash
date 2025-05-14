import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { economicIndicators } from '../data/indicators';
import { IndicatorData, IndicatorDataPoint } from '../types';
import { getLastUpdatedTimestamp } from '../services/api';

interface IndicatorPreviewData {
  name: string;
  seriesId: string;
  lastUpdated: string | null;
  latestValue: string;
  latestDate: string;
  dataSource: string;
}

const DataPreview: React.FC = () => {
  const [previewData, setPreviewData] = useState<IndicatorPreviewData[]>([]);

  useEffect(() => {
    const loadPreviewData = () => {
      const data = economicIndicators.map(indicator => {
        const storageKey = `economic_indicator_api_${indicator.id}`;
        const uploadedStorageKey = `economic_indicator_uploaded_${indicator.id}`;
        
        // Try to get API data first
        const storedData = localStorage.getItem(storageKey);
        const uploadedData = localStorage.getItem(uploadedStorageKey);
        const lastUpdated = getLastUpdatedTimestamp(indicator.id);
        
        let latestData: IndicatorDataPoint | undefined;
        let dataSource = 'No Data';
        
        if (storedData) {
          const parsed = JSON.parse(storedData);
          latestData = parsed.data.data[0];
          dataSource = 'API';
        } else if (uploadedData) {
          const parsed = JSON.parse(uploadedData);
          latestData = parsed.data[0];
          dataSource = 'Uploaded';
        }

        return {
          name: indicator.name,
          seriesId: indicator.seriesId,
          lastUpdated: lastUpdated ? format(new Date(lastUpdated), 'MMM d, yyyy HH:mm:ss') : 'Never',
          latestValue: latestData ? latestData.value.toLocaleString() : 'No data',
          latestDate: latestData ? format(new Date(latestData.date), 'MMM d, yyyy') : 'No data',
          dataSource
        };
      });

      setPreviewData(data);
    };

    loadPreviewData();
  }, []);

  return (
    <div className="bg-white shadow-md rounded-lg p-4">
      <h2 className="text-xl font-semibold mb-4">Current Data Preview</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full table-auto">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-4 py-2 text-left">Indicator</th>
              <th className="px-4 py-2 text-left">Series ID</th>
              <th className="px-4 py-2 text-left">Latest Value</th>
              <th className="px-4 py-2 text-left">Latest Date</th>
              <th className="px-4 py-2 text-left">Last Updated</th>
              <th className="px-4 py-2 text-left">Source</th>
            </tr>
          </thead>
          <tbody>
            {previewData.map((item, index) => (
              <tr 
                key={item.seriesId}
                className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
              >
                <td className="px-4 py-2">{item.name}</td>
                <td className="px-4 py-2 font-mono text-sm">{item.seriesId}</td>
                <td className="px-4 py-2">{item.latestValue}</td>
                <td className="px-4 py-2">{item.latestDate}</td>
                <td className="px-4 py-2">{item.lastUpdated}</td>
                <td className="px-4 py-2">
                  <span className={`px-2 py-1 rounded text-sm ${
                    item.dataSource === 'API' 
                      ? 'bg-green-100 text-green-800'
                      : item.dataSource === 'Uploaded'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {item.dataSource}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DataPreview; 