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

// Register ChartJS components
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
  const chartData = {
    labels: filteredData.map(point => {
      const date = new Date(point.date);
      return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short' });
    }),
    datasets: [{
      label: data.indicator.name,
      data: filteredData.map(point => point.value),
      segment: {
        borderColor: (ctx) => {
          if (!ctx.p0.parsed || !ctx.p1.parsed) return '#999999';
          const date = filteredData[ctx.p0.index].date;
          const president = getPresidentByDate(date);
          return president?.color || '#999999';
        }
      },
      backgroundColor: 'transparent',
      borderWidth: 2,
      pointRadius: 2,
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