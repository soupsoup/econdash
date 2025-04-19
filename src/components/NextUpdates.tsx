import React, { useState, useEffect } from 'react';
import { economicIndicators } from '../data/indicators';
import { getNextUpdateDate, formatDateTime } from '../utils/dateUtils';
import { Clock } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';

interface UpdateInfo {
  id: string;
  name: string;
  nextUpdate: Date;
}

const NextUpdates: React.FC = () => {
  const [updates, setUpdates] = useState<UpdateInfo[]>([]);
  const [timeUntilNextUpdate, setTimeUntilNextUpdate] = useState<string>('');
  const [visibleCharts] = useLocalStorage<string[]>('visibleCharts', 
    economicIndicators.map(i => i.id));

  useEffect(() => {
    // Calculate next update for each visible indicator
    const updateInfos = economicIndicators
      .filter(indicator => visibleCharts.includes(indicator.id))
      .map(indicator => ({
        id: indicator.id,
        name: indicator.name,
        nextUpdate: getNextUpdateDate(indicator)
      }));

    // Sort by next update date
    const sortedUpdates = updateInfos.sort((a, b) => 
      a.nextUpdate.getTime() - b.nextUpdate.getTime()
    );

    setUpdates(sortedUpdates);
  }, [visibleCharts]);

  useEffect(() => {
    if (updates.length === 0) return;

    const updateCountdown = () => {
      const now = new Date();
      const nextUpdate = updates[0].nextUpdate;
      const diff = nextUpdate.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeUntilNextUpdate('Due now');
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      let countdown = '';
      if (days > 0) countdown += `${days}d `;
      if (hours > 0) countdown += `${hours}h `;
      countdown += `${minutes}m`;

      setTimeUntilNextUpdate(countdown);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [updates]);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center mb-6">
        <Clock className="h-6 w-6 text-blue-600 mr-2" />
        <h2 className="text-xl font-semibold">Upcoming Data Updates</h2>
      </div>
      
      {updates.length > 0 && (
        <div className="mb-8 p-4 bg-blue-50 rounded-lg border border-blue-100">
          <p className="text-lg text-blue-900">
            Next update: <span className="font-semibold">{updates[0].name}</span>
            <br />
            Time until update: <span className="font-semibold">{timeUntilNextUpdate}</span>
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {updates.map(update => (
          <div 
            key={update.id} 
            className="bg-gray-50 rounded-lg p-4 border border-gray-100"
          >
            <h3 className="font-semibold text-gray-800 mb-2">{update.name}</h3>
            <p className="text-gray-600 text-sm">{formatDateTime(update.nextUpdate)}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NextUpdates; 