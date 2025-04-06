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
import { IndicatorData } from '../types';
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

  const formatValue = (value: number | null): string => {
    if (value === null || value === undefined || isNaN(value)) {
      return 'N/A';
    }

    if (data.indicator.id === 'job-creation') {
      return Math.round(value).toLocaleString();
    }

    return Math.abs(value) < 0.01 ? 
      value.toExponential(2) : 
      value.toFixed(2);
  };

  const chartData = {
    labels: filteredData.map(point => {
      const date = new Date(point.date);
      return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short' });
    }),
    datasets: [{
      label: data.indicator.name,
      data: filteredData.map(point => Number(point.value) || 0),
      borderColor: '#2563eb',
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
            if (!context?.[0]?.dataIndex) return 'Unknown Date';
            const point = filteredData[context[0].dataIndex];
            const date = new Date(point.date);
            const president = getPresidentByDate(point.date);
            return `${date.toLocaleDateString()} (${president?.name || 'Unknown'})`;
          },
          label: function(context) {
            if (typeof context.raw !== 'number') {
              return `${data.indicator.name}: N/A`;
            }

            const value = Number(context.raw);
            if (isNaN(value) || !isFinite(value)) {
              return `${data.indicator.name}: N/A`;
            }

            const formattedValue = formatValue(value);
            return `${data.indicator.name}: ${formattedValue}${data.indicator.unit || ''}`;
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

  return <Line data={chartData} options={options} />;
};

export default DetailChart;