
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

const DetailChart: React.FC<DetailChartProps> = ({ data, filteredData }) => {
  // Sort data chronologically
  const sortedData = [...filteredData].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
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
            const point = filteredData[context[0].dataIndex];
            const date = new Date(point.date);
            const president = getPresidentByDate(point.date);
            return `${date.toLocaleDateString()} (${president?.name || 'Unknown'})`;
          },
          label: function(context) {
            return `${data.indicator.name}: ${context.parsed.y.toFixed(2)}${data.indicator.unit}`;
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
