import React from 'react';
import { IndicatorData } from '../types';
import { presidents } from '../data/presidents';

interface PresidentialPeriodsProps {
  data: IndicatorData;
}

const PresidentialPeriods: React.FC<PresidentialPeriodsProps> = ({ data }) => {
  const { indicator, data: dataPoints } = data;
  
  // Calculate statistics for each president
  const presidentialStats = presidents.map(president => {
    // Create a unique ID for each presidency using the term start date
    const presidencyId = `${president.name}-${president.term.start}`;
    
    // Filter data points that fall within this president's term
    const presidentData = dataPoints
      .filter(point => {
        const pointDate = new Date(point.date);
        const startDate = new Date(president.term.start);
        const endDate = president.term.end ? new Date(president.term.end) : new Date();
        return pointDate >= startDate && pointDate < endDate;
      })
      .filter(point => !isNaN(point.value)) // Filter out any NaN values
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()); // Sort by date
    
    if (presidentData.length === 0) {
      return { president, stats: null, presidencyId };
    }
    
    // Calculate statistics
    const values = presidentData.map(point => point.value);
    const average = values.reduce((sum, val) => sum + val, 0) / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);
    
    // Calculate start and end values
    const startValue = presidentData[0].value;
    const endValue = presidentData[presidentData.length - 1].value;
    const netChange = endValue - startValue;
    const percentChange = ((endValue - startValue) / startValue) * 100;
    
    // Calculate annualized change
    const startDate = new Date(presidentData[0].date);
    const endDate = new Date(presidentData[presidentData.length - 1].date);
    const yearsDiff = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
    const annualizedChange = yearsDiff > 0 ? (Math.pow((endValue / startValue), 1 / yearsDiff) - 1) * 100 : 0;
    
    return {
      president,
      stats: {
        average,
        min,
        max,
        startValue,
        endValue,
        netChange,
        percentChange,
        annualizedChange,
        dataPoints: presidentData.length
      },
      presidencyId
    };
  }).filter(item => item.stats !== null);
  
  // Sort by performance (considering whether higher is better)
  presidentialStats.sort((a, b) => {
    if (!a.stats || !b.stats) return 0;
    
    return indicator.higherIsBetter
      ? b.stats.percentChange - a.stats.percentChange
      : a.stats.percentChange - b.stats.percentChange;
  });
  
  // Format value based on indicator type
  const formatValue = (value: number) => {
    if (indicator.id === 'job-creation') {
      // For job creation, show in millions with 3 decimal places
      return (value / 1000).toFixed(3);
    } else if (indicator.id === 'stock-market') {
      // For S&P 500, show with commas and 2 decimal places
      return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    } else {
      // For other indicators, use the default formatting with decimals
      return value.toFixed(2);
    }
  };
  
  // Format change value based on indicator type
  const formatChange = (value: number) => {
    if (indicator.id === 'job-creation') {
      // For job creation, show change in millions with 3 decimal places
      return (value / 1000).toFixed(3);
    } else if (indicator.id === 'stock-market') {
      // For S&P 500, show with commas and 2 decimal places
      return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    } else {
      // For other indicators, use the default formatting with decimals
      return value.toFixed(2);
    }
  };
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-10">
      {presidentialStats.length === 0 ? (
        <div className="py-8 text-ink-soft lg:col-span-2">
          No data available for this time period
        </div>
      ) : (
        presidentialStats.map(({ president, stats, presidencyId }) => {
          if (!stats) return null;

          const isPositiveChange = indicator.higherIsBetter
            ? stats.netChange > 0
            : stats.netChange < 0;
          const tone = isPositiveChange ? 'text-good' : 'text-accent';

          return (
            <article key={presidencyId} className="border-t-2 border-ink pt-3 min-w-0">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h3 className="font-display font-extrabold text-2xl leading-tight flex items-center gap-2">
                    <span
                      className="inline-block h-3 w-3 shrink-0"
                      style={{ backgroundColor: president.color }}
                      aria-hidden="true"
                    />
                    {president.name}
                  </h3>
                  <p className="font-mono text-[11px] uppercase tracking-wide text-ink-soft mt-1">
                    {president.term.start} to {president.term.end || 'Present'}
                  </p>
                </div>
                <div className={`font-display font-extrabold text-3xl tracking-tight whitespace-nowrap ${tone}`}>
                  {isPositiveChange ? '▲' : '▼'} {stats.percentChange > 0 ? '+' : ''}
                  {stats.percentChange.toFixed(2)}%
                </div>
              </div>

              <dl className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-3 pb-4 border-b border-rule">
                <div>
                  <dt className="eyebrow !text-[11px]">Start</dt>
                  <dd className="font-semibold">{formatValue(stats.startValue)} {indicator.unit}</dd>
                </div>
                <div>
                  <dt className="eyebrow !text-[11px]">End</dt>
                  <dd className="font-semibold">{formatValue(stats.endValue)} {indicator.unit}</dd>
                </div>
                <div>
                  <dt className="eyebrow !text-[11px]">Net change</dt>
                  <dd className={`font-semibold ${tone}`}>
                    {stats.netChange > 0 ? '+' : ''}{formatChange(stats.netChange)} {indicator.unit}
                  </dd>
                </div>
                <div>
                  <dt className="eyebrow !text-[11px]">Annualized</dt>
                  <dd className={`font-semibold ${tone}`}>
                    {stats.annualizedChange > 0 ? '+' : ''}{stats.annualizedChange.toFixed(2)}%
                  </dd>
                </div>
              </dl>

              <dl className="pt-3 grid grid-cols-3 gap-4">
                <div>
                  <dt className="eyebrow !text-[11px]">Average</dt>
                  <dd>{formatValue(stats.average)} {indicator.unit}</dd>
                </div>
                <div>
                  <dt className="eyebrow !text-[11px]">Minimum</dt>
                  <dd>{formatValue(stats.min)} {indicator.unit}</dd>
                </div>
                <div>
                  <dt className="eyebrow !text-[11px]">Maximum</dt>
                  <dd>{formatValue(stats.max)} {indicator.unit}</dd>
                </div>
              </dl>
            </article>
          );
        })
      )}
    </div>
  );
};

export default PresidentialPeriods;
