import React, { useState, useEffect } from 'react';
import { economicIndicators } from '../data/indicators';
import { getNextUpdateDate, formatDateTime } from '../utils/dateUtils';
import { Clock } from 'lucide-react';

interface UpdateInfo {
  id: string;
  name: string;
  nextUpdate: Date;
}

const NextUpdates: React.FC = () => {
  const [updates, setUpdates] = useState<UpdateInfo[]>([]);
  const [timeUntilNextUpdate, setTimeUntilNextUpdate] = useState<string>('');

  useEffect(() => {
    // Calculate next update for each indicator
    const updateInfos = economicIndicators.map(indicator => ({
      id: indicator.id,
      name: indicator.name,
      nextUpdate: getNextUpdateDate(indicator)
    }));

    // Sort by next update date
    const sortedUpdates = updateInfos.sort((a, b) => 
      a.nextUpdate.getTime() - b.nextUpdate.getTime()
    );

    setUpdates(sortedUpdates);
  }, []);

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
      <div className="flex items-center mb-4">
        <Clock className="h-5 w-5 text-blue-600 mr-2" />
        <h2 className="text-lg font-semibold">Upcoming Data Updates</h2>
      </div>
      
      {updates.length > 0 && (
        <div className="mb-4 p-3 bg-blue-50 rounded-md">
          <p className="text-sm text-blue-800">
            Next update: <span className="font-semibold">{updates[0].name}</span>
            <br />
            Time until update: <span className="font-semibold">{timeUntilNextUpdate}</span>
          </p>
        </div>
      )}

      <div className="space-y-3">
        {updates.map(update => (
          <div key={update.id} className="flex justify-between items-start text-sm">
            <span className="font-medium text-gray-700">{update.name}</span>
            <span className="text-gray-600">{formatDateTime(update.nextUpdate)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NextUpdates; 