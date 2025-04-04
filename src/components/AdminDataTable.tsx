
import React, { useState, useEffect } from 'react';
import { fetchIndicatorData, updateIndicatorData } from '../services/api';
import { IndicatorDataPoint } from '../types';

interface AdminDataTableProps {
  indicatorId: string;
}

export default function AdminDataTable({ indicatorId }: AdminDataTableProps) {
  const [data, setData] = useState<IndicatorDataPoint[]>([]);
  const [editingPoint, setEditingPoint] = useState<IndicatorDataPoint | null>(null);

  useEffect(() => {
    loadData();
  }, [indicatorId]);

  const loadData = async () => {
    const result = await fetchIndicatorData(indicatorId);
    if (result) {
      setData(result.data);
    }
  };

  const handleDelete = (point: IndicatorDataPoint) => {
    const newData = data.filter(p => p.date !== point.date);
    updateIndicatorData(indicatorId, newData);
    setData(newData);
  };

  const handleEdit = (point: IndicatorDataPoint) => {
    setEditingPoint(point);
  };

  const handleSave = () => {
    if (!editingPoint) return;
    
    const newData = data.map(p => 
      p.date === editingPoint.date ? editingPoint : p
    );
    
    updateIndicatorData(indicatorId, newData);
    setData(newData);
    setEditingPoint(null);
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Value</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">President</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map(point => (
            <tr key={point.date}>
              <td className="px-6 py-4 whitespace-nowrap">{point.date}</td>
              <td className="px-6 py-4 whitespace-nowrap">
                {editingPoint?.date === point.date ? (
                  <input
                    type="number"
                    value={editingPoint.value}
                    onChange={e => setEditingPoint({
                      ...editingPoint,
                      value: parseFloat(e.target.value)
                    })}
                    className="border rounded p-1"
                  />
                ) : point.value}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">{point.president}</td>
              <td className="px-6 py-4 whitespace-nowrap">
                {editingPoint?.date === point.date ? (
                  <button
                    onClick={handleSave}
                    className="text-green-600 hover:text-green-800 mr-4"
                  >
                    Save
                  </button>
                ) : (
                  <button
                    onClick={() => handleEdit(point)}
                    className="text-blue-600 hover:text-blue-800 mr-4"
                  >
                    Edit
                  </button>
                )}
                <button
                  onClick={() => handleDelete(point)}
                  className="text-red-600 hover:text-red-800"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
