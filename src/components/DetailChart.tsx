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
  if (!data?.indicator || !Array.isArray(filteredData) || filteredData.length === 0) {
    return <div className="h-full flex items-center justify-center text-gray-500">No data available</div>;
  }

  // Process data points
  const validDataPoints = filteredData
    .filter(point => point && typeof point.value === 'number' && point.date)
    .map(point => ({
      date: new Date(point.date),
      value: Number(point.value)
    }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  if (validDataPoints.length === 0) {
    return <div className="h-full flex items-center justify-center text-gray-500">No valid data points</div>;
  }

  // Create chart data
  const chartData = {
    labels: validDataPoints.map(point => 
      point.date.toLocaleDateString(undefined, { 
        year: 'numeric',
        month: 'short'
      })
    ),
    datasets: [{
      label: data.indicator.name,
      data: validDataPoints.map(point => point.value),
      borderColor: '#2563eb',
      backgroundColor: 'rgba(37, 99, 235, 0.1)',
      borderWidth: 2,
      pointRadius: 1,
      pointHoverRadius: 5,
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
          title: (context) => {
            if (context[0]) {
              const date = validDataPoints[context[0].dataIndex].date;
              const president = getPresidentByDate(date.toISOString());
              return `${date.toLocaleDateString()} (${president?.name || 'Unknown'})`;
            }
            return '';
          },
          label: (context) => {
            if (typeof context.raw === 'number') {
              const value = context.raw;
              const formattedValue = Math.abs(value) < 0.01 ? 
                value.toExponential(2) : 
                value.toFixed(2);
              return `${data.indicator.name}: ${formattedValue}${data.indicator.unit || ''}`;
            }
            return `${data.indicator.name}: N/A`;
          }
        }
      }
    },
    scales: {
      x: {
        display: true,
        grid: {
          display: false
        },
        ticks: {
          maxRotation: 45,
          minRotation: 45
        }
      },
      y: {
        display: true,
        grid: {
          color: '#f0f0f0'
        },
        ticks: {
          callback: (value) => {
            if (typeof value === 'number') {
              return Math.abs(value) < 0.01 ? 
                value.toExponential(2) : 
                value.toFixed(2);
            }
            return '';
          }
        }
      }
    }
  };

  return (
    <div className="w-full h-full">
      <Line data={chartData} options={options} />
    </div>
  );
};

export default DetailChart;