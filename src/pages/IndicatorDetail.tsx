import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import { subYears } from 'date-fns';
import { fetchIndicatorData, getLastUpdatedTimestamp } from '../services/api';
import Header from '../components/Header';
import DetailChart from '../components/DetailChart';
import PresidentialPeriods from '../components/PresidentialPeriods';
import DataTable from '../components/DataTable';
import ApiErrorNotice from '../components/MockDataNotice';
import { EconomicIndicator } from '../types';

const IndicatorDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [apiErrors, setApiErrors] = useState<Record<string, string>>({});
  const [lastUpdated, setLastUpdated] = useState<string | null>(getLastUpdatedTimestamp(id || ''));
  const [timeRange, setTimeRange] = useState<number>(10);
  const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart');
  const [isEditing, setIsEditing] = useState(false);
  const [editedDescription, setEditedDescription] = useState('');

  // Add state for admin status (you might want to replace this with proper auth)
  const [isAdmin] = useState(true);

  // Only read the saved data source info from localStorage
  const editedSourceInfo = localStorage.getItem(`indicator-source-info-${id}`);

  const { data: indicatorData = { indicator: { id: '', name: '', description: '', unit: '', source: 'fred', sourceUrl: '', frequency: 'monthly', higherIsBetter: false, seriesId: '', transform: 'none' } as EconomicIndicator, data: [], source: 'api' }, isLoading, error, refetch } = useQuery(
    ['indicatorData', id],
    async () => {
      console.log('Starting fetch for indicator:', id);
      console.log('Current local storage state:', localStorage.getItem(`presidential_dashboard_indicator-${id}`));
      try {
        const data = await fetchIndicatorData(id || '');
        console.log('Indicator data fetch result:', {
          hasData: !!data,
          dataPoints: data?.data?.length,
          indicator: data?.indicator,
          firstPoint: data?.data?.[0],
          lastPoint: data?.data?.[data?.data?.length - 1]
        });
        return data;
      } catch (err) {
        console.error('Error fetching indicator data:', err);
        throw err;
      }
    },
    {
      enabled: !!id,
      refetchOnWindowFocus: false,
      retry: 2,
      retryDelay: 1000,
      onSuccess: () => {
        setLastUpdated(getLastUpdatedTimestamp(id || ''));
      },
      onError: (err) => {
        console.error('Error fetching indicator data:', err);
        if (err instanceof Error) {
          setApiErrors(prev => ({
            ...prev,
            'Data Fetch Error': err.message
          }));
        } else {
          setApiErrors(prev => ({
            ...prev,
            'Unknown Error': String(err)
          }));
        }
      }
    }
  );

  // Get indicator after indicatorData is defined
  const indicator = indicatorData.indicator;

  // Calculate cutoff date
  const cutoffDate = subYears(new Date(), timeRange);
  const minDate = new Date('2005-06-30');
  const filteredData = indicatorData.data.filter(point => {
    const pointDate = new Date(point.date);
    return pointDate >= cutoffDate && pointDate >= minDate;
  });

  // Create memoized derived data
  const {
    currentValue,
    average,
    minValue,
    maxValue,
    processedData
  } = useMemo(() => {
    let current = 0;
    let avg = 0;
    let min = Infinity;
    let max = -Infinity;
    let processed = filteredData;

    if (processed.length > 0) {
      // Latest reading = the point with the most recent date, whatever the array order
      current = processed.reduce((a, b) => (new Date(b.date) > new Date(a.date) ? b : a)).value;
    }

    // Calculate statistics from the processed values
    const values = processed.map(point => point.value).filter(val => !isNaN(val));
    if (values.length > 0) {
      avg = values.reduce((sum, val) => sum + val, 0) / values.length;
      min = Math.min(...values);
      max = Math.max(...values);
    }

    return {
      currentValue: current,
      average: avg,
      minValue: min,
      maxValue: max,
      processedData: processed
    };
  }, [filteredData, indicatorData.indicator?.id]);

  // Create memoized CSV data
  const csvData = useMemo(() => {
    if (indicatorData.indicator?.id === 'monthly-inflation') {
      // For monthly inflation, export the raw CPI values
      return filteredData.map(point => ({
        Date: point.date,
        Value: point.value,
        President: point.president
      }));
    }
    return filteredData.map(point => ({
      Date: point.date,
      Value: point.value,
      President: point.president
    }));
  }, [filteredData, indicatorData.indicator?.id]);

  const formatValue = (value: number) => {
    if (!Number.isFinite(value)) return 'N/A';
    if (indicatorData.indicator?.id === 'job-creation') {
      // Employment is stored in thousands; show millions
      return `${(value / 1000).toFixed(3)}M`;
    }
    const text = value.toLocaleString(undefined, { maximumFractionDigits: 2 });
    const unit = indicatorData.indicator?.unit;
    if (!unit || unit === 'index') return text;
    return unit === '%' ? `${text}%` : `${text} ${unit}`;
  };

  const exportCSV = () => {
    const headers = ['Date', `Value (${indicatorData.indicator?.unit})`, 'President'];
    const csvContent = [
      headers.join(','),
      ...filteredData.map(point => 
        `${point.date},${point.value},${point.president}`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${indicatorData.indicator?.id}-data.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleEditClick = () => {
    setEditedDescription(indicatorData.indicator.description);
    setIsEditing(true);
  };

  const handleSaveClick = () => {
    // Here you would typically make an API call to save the changes
    // For now, we'll just update it in local storage
    const storedData = localStorage.getItem(`presidential_dashboard_indicator-${id}`);
    if (storedData) {
      const data = JSON.parse(storedData);
      data.indicator.description = editedDescription;
      localStorage.setItem(`presidential_dashboard_indicator-${id}`, JSON.stringify(data));
      refetch();
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedDescription('');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-paper">
        <Header />
        <div className="container mx-auto px-4 max-w-6xl py-16 animate-pulse">
          <div className="h-12 bg-rule w-2/3 mb-5"></div>
          <div className="h-5 bg-rule w-1/2 mb-10"></div>
          <div className="h-80 bg-rule/60 w-full"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-paper">
        <Header />
        <div className="container mx-auto px-4 max-w-3xl py-16">
          <div className="eyebrow !text-accent">Error</div>
          <h1 className="mt-2 font-display font-extrabold text-4xl tracking-tight">We couldn't load this data</h1>
          <p className="mt-3 text-lg text-ink-soft">The economic data for this indicator could not be retrieved.</p>
          <p className="mt-6 font-mono text-xs border-y border-accent text-accent py-3 overflow-auto max-h-48">
            {error instanceof Error ? error.message : 'Unknown error'}
          </p>
          <button
            onClick={() => navigate('/')}
            className="mt-6 font-mono text-xs uppercase tracking-wider border border-ink px-4 py-2 hover:bg-ink hover:text-paper"
          >
            ← Back to dashboard
          </button>
        </div>
      </div>
    );
  }

  const rangeLabel = timeRange === 1 ? 'Last year' : `Last ${timeRange} years`;
  const pillBase = 'font-mono text-xs uppercase tracking-wider px-3 py-2 border border-ink';
  const pillOn = 'bg-ink text-paper';
  const pillOff = 'bg-transparent hover:bg-black/5';

  return (
    <div className="min-h-screen bg-paper">
      <Header />

      <main className="container mx-auto px-4 max-w-6xl py-8">
        <button
          onClick={() => navigate('/')}
          className="eyebrow border-b border-ink pb-0.5 hover:text-accent"
        >
          ← Back to dashboard
        </button>

        <section className="mt-6 flex flex-wrap items-end justify-between gap-x-10 gap-y-5 pb-6 border-b-4 border-double border-ink">
          <div className="flex-[3_1_520px] min-w-0">
            <div className="eyebrow !text-accent">
              {indicator.frequency} · {indicator.source}
            </div>
            <h1 className="mt-2 font-display font-extrabold text-4xl sm:text-6xl leading-[1.02] tracking-tight">
              {indicator.name}
            </h1>
            {isEditing ? (
              <div className="mt-3">
                <textarea
                  value={editedDescription}
                  onChange={(e) => setEditedDescription(e.target.value)}
                  className="w-full p-2 bg-paper border border-ink focus:outline-none focus:ring-2 focus:ring-accent"
                  rows={3}
                />
                <div className="mt-2 flex gap-2">
                  <button onClick={handleSaveClick} className={`${pillBase} ${pillOn}`}>Save</button>
                  <button onClick={handleCancelEdit} className={`${pillBase} ${pillOff}`}>Cancel</button>
                </div>
              </div>
            ) : (
              <p className="mt-3 text-xl leading-relaxed text-ink-soft max-w-3xl">{indicator.description}</p>
            )}
          </div>

          <div className="flex-[1_1_220px] flex flex-col items-start sm:items-end gap-3">
            <div className="font-mono text-xs uppercase tracking-wide text-ink-soft">
              {lastUpdated ? `Last updated ${new Date(lastUpdated).toLocaleDateString()}` : 'No update information'}
            </div>
            <button onClick={exportCSV} className={`${pillBase} ${pillOff}`}>
              Export data ↓
            </button>
          </div>
        </section>

        {Object.keys(apiErrors).length > 0 && (
          <div className="mt-6"><ApiErrorNotice errors={apiErrors} /></div>
        )}

        {/* Stat strip */}
        <section className="grid grid-cols-2 lg:grid-cols-4 border-b border-ink">
          {[
            { label: 'Latest', value: currentValue },
            { label: `Average · ${rangeLabel.toLowerCase()}`, value: average },
            { label: 'Low', value: minValue },
            { label: 'High', value: maxValue },
          ].map((stat, i) => (
            <div
              key={stat.label}
              className={`py-5 pr-4 ${i > 0 ? 'lg:pl-5' : ''} ${i % 2 === 1 ? 'pl-4 lg:pl-5' : ''} border-r border-rule last:border-r-0`}
            >
              <div className="eyebrow !text-[11px]">{stat.label}</div>
              <div className="mt-1.5 font-display font-extrabold text-3xl sm:text-4xl tracking-tight">
                {Number.isFinite(stat.value) && processedData.length > 0 ? formatValue(stat.value) : 'N/A'}
              </div>
            </div>
          ))}
        </section>

        {/* Controls */}
        <section className="mt-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Time range">
            {[1, 5, 10, 20, 30].map(years => (
              <button
                key={years}
                onClick={() => setTimeRange(years)}
                aria-pressed={timeRange === years}
                className={`${pillBase} ${timeRange === years ? pillOn : pillOff}`}
              >
                {years === 1 ? '1 yr' : `${years} yrs`}
              </button>
            ))}
          </div>
          <div className="flex" role="group" aria-label="View">
            <button
              onClick={() => setViewMode('chart')}
              aria-pressed={viewMode === 'chart'}
              className={`${pillBase} ${viewMode === 'chart' ? pillOn : pillOff}`}
            >
              Chart
            </button>
            <button
              onClick={() => setViewMode('table')}
              aria-pressed={viewMode === 'table'}
              className={`${pillBase} -ml-px ${viewMode === 'table' ? pillOn : pillOff}`}
            >
              Table
            </button>
          </div>
        </section>

        {/* Chart view */}
        {viewMode === 'chart' && (
          <>
            <section className="mt-5 border-y border-ink py-4">
              <div className="h-[400px]">
                <DetailChart data={indicatorData} filteredData={processedData} />
              </div>
              <div className="mt-2 font-mono text-[11px] text-ink-soft">
                Line color shows the party of the sitting president. Source: {indicator.source.toUpperCase()}, series {indicator.seriesId || 'n/a'}.
              </div>
            </section>

            <section className="mt-12 border-t-4 border-double border-ink pt-5">
              <div className="flex items-baseline justify-between gap-3 mb-6">
                <h2 className="section-title">Presidential Performance</h2>
                <span className="eyebrow hidden sm:inline">By administration</span>
              </div>
              <PresidentialPeriods data={indicatorData} />
            </section>
          </>
        )}

        {/* Table view */}
        {viewMode === 'table' && (
          <section className="mt-5 border-t border-ink pt-4">
            <DataTable data={processedData} indicator={indicatorData.indicator} />
          </section>
        )}

        <section className="mt-12 border-t-4 border-double border-ink pt-5">
          <div className="flex items-baseline justify-between gap-3 mb-4">
            <h2 className="section-title">Data Source</h2>
            <span className="eyebrow hidden sm:inline">Where this comes from</span>
          </div>
          <p className="text-lg text-ink-soft max-w-3xl">
            {editedSourceInfo || `This data is sourced from ${indicator.source.toUpperCase()} and is updated ${indicator.frequency}.`}
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 py-3 border-y border-rule">
            <div className="font-mono text-xs uppercase tracking-wide text-ink-soft">
              Source: {indicator.source} · Updated {indicator.frequency}
            </div>
            {indicator.sourceUrl && (
              <a
                href={indicator.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-xs uppercase tracking-wider border-b border-ink"
              >
                Visit official source ↗
              </a>
            )}
          </div>
        </section>
      </main>

      <footer className="mt-12 border-t border-ink">
        <div className="container mx-auto px-4 max-w-6xl py-6 flex flex-wrap justify-between gap-2 font-mono text-xs text-ink-soft">
          <span>The Economy © {new Date().getFullYear()}</span>
          <span>Data: Federal Reserve Economic Data (FRED), BLS, BEA, Census</span>
        </div>
      </footer>
    </div>
  );
};

export default IndicatorDetail;
