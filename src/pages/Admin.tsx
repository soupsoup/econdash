import React, { useState } from 'react';
import { economicIndicators } from '../data/indicators';

const Admin: React.FC = () => {
  const [editedSourceInfo, setEditedSourceInfo] = useState<{ [id: string]: string }>(() => {
    const obj: { [id: string]: string } = {};
    economicIndicators.forEach(ind => {
      const saved = localStorage.getItem(`indicator-source-info-${ind.id}`);
      obj[ind.id] = saved || `This data is sourced from ${ind.source} and is updated ${ind.frequency}.`;
    });
    return obj;
  });
  const [status, setStatus] = useState<string>('');

  const handleChange = (id: string, value: string) => {
    setEditedSourceInfo(prev => ({ ...prev, [id]: value }));
  };

  const handleSave = (id: string) => {
    localStorage.setItem(`indicator-source-info-${id}`, editedSourceInfo[id]);
    setStatus(`Saved for ${id}`);
    setTimeout(() => setStatus(''), 2000);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Admin: Edit Indicator Data Source Info</h1>
      {status && <div className="mb-4 text-green-700">{status}</div>}
      <div className="space-y-8">
        {economicIndicators.map(ind => (
          <div key={ind.id} className="bg-white rounded shadow p-4">
            <h2 className="text-lg font-semibold mb-2">{ind.name}</h2>
            <textarea
              className="w-full p-2 border border-gray-300 rounded mb-2"
              rows={3}
              value={editedSourceInfo[ind.id]}
              onChange={e => handleChange(ind.id, e.target.value)}
            />
            <button
              className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
              onClick={() => handleSave(ind.id)}
            >
              Save
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Admin; 