import React, { useState, useEffect } from 'react';
import { economicIndicators } from '../data/indicators';
import { getNextUpdateDate, formatDateTime } from '../utils/dateUtils';
import { useVisibleCharts } from '../hooks/useVisibleCharts';

interface UpdateInfo {
  id: string;
  name: string;
  nextUpdate: Date;
}

// ErrorBoundary component
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: any, info: any) {
    // Log error if needed
    console.error('ErrorBoundary caught an error:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return <div className="border-y-2 border-accent text-accent py-3">An error occurred while loading updates. Please try again later.</div>;
    }
    return this.props.children;
  }
}

const NextUpdates: React.FC = () => {
  const [updates, setUpdates] = useState<UpdateInfo[]>([]);
  const [timeUntilNextUpdate, setTimeUntilNextUpdate] = useState<string>('');
  const [visibleCharts] = useVisibleCharts();

  useEffect(() => {
    // Calculate next update for each visible indicator
    const updateInfos = economicIndicators
      .filter(indicator => visibleCharts.includes(indicator.id))
      .map(indicator => {
        const nextUpdate = getNextUpdateDate(indicator);
        if (!nextUpdate) return null;
        return {
          id: indicator.id,
          name: indicator.name,
          nextUpdate
        };
      })
      .filter((info): info is UpdateInfo => info !== null);

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
    <ErrorBoundary>
      <section className="border-t-4 border-double border-ink pt-5 min-w-0">
        <div className="flex items-baseline justify-between gap-3 mb-4">
          <h2 className="section-title">Upcoming Data Updates</h2>
          <span className="eyebrow">Release schedule</span>
        </div>

        {updates.length > 0 && (
          <div className="mb-2 py-4 border-y border-ink">
            <div className="eyebrow !text-accent">Next release</div>
            <div className="mt-1 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
              <span className="font-display font-extrabold text-2xl tracking-tight">{updates[0].name}</span>
              <span className="font-mono text-sm">in {timeUntilNextUpdate}</span>
            </div>
          </div>
        )}

        <ul>
          {updates.map(update => (
            <li
              key={update.id}
              className="flex flex-wrap justify-between gap-x-6 gap-y-1 py-3 border-b border-rule"
            >
              <span className="font-semibold">{update.name}</span>
              <span className="font-mono text-xs text-ink-soft sm:text-right">{formatDateTime(update.nextUpdate)}</span>
            </li>
          ))}
        </ul>
      </section>
    </ErrorBoundary>
  );
};

export default NextUpdates; 