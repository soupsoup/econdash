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
  ChartOptions,
  TimeScale
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { IndicatorData } from '../types';
import { getPresidentByDate } from '../data/presidents';
import 'chartjs-adapter-date-fns';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);

interface DetailChartProps {
  data: IndicatorData;
  filteredData: any[];
}

const DetailChart: React.FC<DetailChartProps> = ({ data, filteredData }) => {
  if (!data?.indicator?.name || !Array.isArray(filteredData) || filteredData.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        No data available
      </div>
    );
  }

  console.log('DetailChart data:', data);
  console.log('DetailChart filteredData:', filteredData);

  // Create segments based on presidential terms
  const segments = filteredData.map((point, index) => {
    const president = getPresidentByDate(point.date);
    return {
      borderColor: president?.color || '#999999',
      backgroundColor: `${president?.color}33` || '#99999933'
    };
  });

  // Sort data chronologically
  const sortedData = [...filteredData].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Dynamically determine min and max dates for x-axis
  const minDate = sortedData.length > 0 ? sortedData[0].date : undefined;
  const maxDate = sortedData.length > 0 ? sortedData[sortedData.length - 1].date : undefined;

  // Detect if the indicator is quarterly
  const isQuarterly = data?.indicator?.frequency === 'quarterly';

  const chartData = {
    labels: sortedData.map(point => {
      const date = new Date(point.date);
      return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short' });
    }),
    datasets: [{
      label: data.indicator.name,
      data: sortedData.map(point => ({
        x: point.date,
        y: Number(point.value) || null
      })),
      borderColor: '#2563eb',
      backgroundColor: 'transparent',
      borderWidth: 2,
      pointRadius: 1,
      pointHoverRadius: 6,
      tension: 0.3,
      segment: {
        borderColor: (ctx: any) => segments[ctx.p0DataIndex]?.borderColor || '#999999'
      }
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
          title: function(context: any) {
            if (!context?.[0]?.raw?.x) return 'Unknown Date';
            const date = new Date(context[0].raw.x);
            const president = getPresidentByDate(date.toISOString());
            return `${date.toLocaleDateString()} (${president?.name || 'Unknown'})`;
          },
          label: function(context: any) {
            const value = context?.raw?.y;
            if (value === null || value === undefined || isNaN(value)) {
              return `${data?.indicator?.name || 'Value'}: N/A`;
            }

            try {
              const formattedValue = Math.abs(value) < 0.01 ? 
                value.toExponential(2) : 
                value.toFixed(2);
              return `${data?.indicator?.name || 'Value'}: ${formattedValue}${data?.indicator?.unit || ''}`;
            } catch (error) {
              console.error('Error formatting value:', error);
              return `${data?.indicator?.name || 'Value'}: ${value}${data?.indicator?.unit || ''}`;
            }
          }
        }
      }
    },
    scales: {
      x: {
        type: 'time',
        time: {
          unit: isQuarterly ? 'quarter' : 'month',
          tooltipFormat: isQuarterly ? 'QQQ yyyy' : 'MMM yyyy',
          displayFormats: {
            quarter: 'QQQ yyyy',
            month: 'MMM yyyy'
          }
        },
        min: minDate,
        max: maxDate,
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

  return <Line data={chartData} options={options} />;
};

export default DetailChart;