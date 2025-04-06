import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { IndicatorData, IndicatorDataPoint } from '../types';
import { getPresidentByDate } from '../data/presidents';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface DetailChartProps {
  data: IndicatorData;
  filteredData: IndicatorDataPoint[];
}

class DetailChartErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 text-center">
          <p className="text-red-600">Unable to display chart due to invalid data</p>
        </div>
      );
    }
    return this.props.children;
  }
}

const DetailChart: React.FC<DetailChartProps> = ({ data, filteredData }) => {
  if (!data?.indicator?.name || !Array.isArray(filteredData)) {
    return <div className="h-full flex items-center justify-center text-gray-500">Invalid data format</div>;
  }

  // Transform and validate data with safe defaults
  const transformData = (rawData: any[]) => {
    if (!Array.isArray(rawData)) return [];
    
    return rawData
      .filter(point => {
        const value = Number(point?.value);
        return point && 
               !isNaN(value) &&
               isFinite(value) &&
               point.date;
      })
      .map(point => {
        const value = Number(point.value);
        return {
          ...point,
          value: isNaN(value) ? 0 : value,
          date: new Date(point.date).toISOString()
        };
      })
      .filter(point => !isNaN(new Date(point.date).getTime()));
  };

  // Sort data chronologically with validated data
  const sortedData = transformData([...(filteredData || [])])
    .filter(point => point.value !== null && point.value !== undefined && !isNaN(point.value))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Early return if no valid data
  if (sortedData.length === 0) {
    return <div className="h-full flex items-center justify-center text-gray-500">No valid data available</div>;
  }

  if (!data?.indicator || !sortedData.length) {
    return <div className="h-full flex items-center justify-center text-gray-500">No data available</div>;
  }


  // Create segments based on presidential terms
  const segments = sortedData.map((point, index) => {
    const president = getPresidentByDate(point.date);
    return {
      value: point.value,
      borderColor: president?.color || '#999999'
    };
  });

  const chartData = {
    labels: sortedData.map(point => {
      const date = new Date(point.date);
      return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short' });
    }),
    datasets: [{
      label: data.indicator.name,
      data: sortedData.map(point => point.value),
      segment: {
        borderColor: (ctx) => segments[ctx.p0DataIndex]?.borderColor || '#999999'
      },
      backgroundColor: 'transparent',
      borderWidth: 2,
      pointRadius: 1,
      pointHoverRadius: 6,
      tension: 0.3
    }]
  };

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          title: function(context) {
            const point = sortedData[context[0].dataIndex];
            const date = new Date(point.date);
            const president = getPresidentByDate(point.date);
            return `${date.toLocaleDateString()} (${president?.name || 'Unknown'})`;
          },
          label: function(context) {
            const formatValue = (val: any): string => {
              if (val === null || val === undefined) return 'N/A';
              const num = Number(val);
              if (isNaN(num) || !isFinite(num)) return 'N/A';
              try {
                return num.toFixed(2);
              } catch (e) {
                return 'N/A';
              }
            };

            const yValue = context?.parsed?.y;
            const formattedValue = formatValue(yValue);
            const unit = data?.indicator?.unit || '';
            const name = data?.indicator?.name || 'Value';
            
            return `${name}: ${formattedValue}${formattedValue === 'N/A' ? '' : unit}`;
          }
        }
      }
    },
    scales: {
      x: {
        display: true,
        grid: {
          display: false
        }
      },
      y: {
        display: true,
        grid: {
          color: '#f0f0f0'
        }
      }
    }
  };

  return (
    <DetailChartErrorBoundary>
      <Line data={chartData} options={options} />
    </DetailChartErrorBoundary>
  );
};

export default DetailChart;