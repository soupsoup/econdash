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

  console.log('Rendering DetailChart');
  console.log('DetailChart data:', data);
  console.log('DetailChart filteredData:', filteredData);

  // If CPI, use minimal chart logic
  if (data.indicator.id === 'cpi') {
    const labels = filteredData.map(point => {
      const d = new Date(point.date);
      return d.toLocaleDateString(undefined, { year: '2-digit', month: 'short' });
    });
    const values = filteredData.map(point => point.value);
    const chartData = {
      labels,
      datasets: [{
        label: '12-Month Percent Change',
        data: values,
        borderColor: '#2563eb',
        backgroundColor: 'rgba(37,99,235,0.1)',
        borderWidth: 2,
        pointRadius: 1,
        pointHoverRadius: 4,
        tension: 0.3,
      }]
    };
    const options: ChartOptions<'line'> = {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx: any) => `${ctx.parsed.y.toFixed(1)}%`
          }
        }
      },
      scales: {
        x: { display: true, title: { display: true, text: 'Month' } },
        y: { display: true, title: { display: true, text: '12-Month % Change' } }
      }
    };
    return <Line data={chartData} options={options} />;
  }

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

  // Helper to get quarter label
  function getQuarterLabel(dateString: string) {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = date.getMonth();
    const quarter = Math.floor(month / 3) + 1;
    return `Q${quarter} ${year}`;
  }

  const isGDP = data.indicator.id === 'GDPC1' || data.indicator.name.toLowerCase().includes('gdp');

  let chartData, options;
  if (isGDP) {
    // GDP: Use quarter labels and category scale
    const quarterLabels = sortedData.map(point => getQuarterLabel(point.date));
    const gdpData = sortedData.map(point => Number(point.value) || null);
    // Debug: print last 5 labels and data values
    console.log('GDP last 5 labels:', quarterLabels.slice(-5));
    console.log('GDP last 5 data:', gdpData.slice(-5));
    chartData = {
      labels: quarterLabels,
      datasets: [{
        label: data.indicator.name,
        data: gdpData,
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
    options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          mode: 'index' as const,
          intersect: false,
          callbacks: {
            title: function(context: any) {
              return context[0].label;
            },
            label: function(context: any) {
              const value = context?.raw;
              if (value === null || value === undefined || isNaN(value)) {
                return `${data?.indicator?.name || 'Value'}: N/A`;
              }
              try {
                const formattedValue = Math.abs(value) < 0.01 ? value.toExponential(2) : value.toFixed(2);
                // Only show the unit if it's not 'index'
                const unit = data?.indicator?.unit?.toLowerCase() === 'index' ? '' : data?.indicator?.unit || '';
                return `${data?.indicator?.name || 'Value'}: ${formattedValue}${unit}`;
              } catch (error) {
                console.error('Error formatting value:', error);
                return `${data?.indicator?.name || 'Value'}: ${value}`;
              }
            }
          }
        }
      },
      scales: {
        x: {
          display: true,
          grid: { display: false },
          type: 'category' as const,
          offset: true,
          ticks: {
            maxRotation: 0,
            autoSkip: false,
            font: { size: 10 }
          }
        },
        y: {
          display: true,
          grid: { color: '#f0f0f0' }
        }
      }
    };
  } else {
    // Default: Use existing logic
    chartData = {
      labels: sortedData.map(point => {
        const date = new Date(point.date);
        return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short' });
      }),
      datasets: [{
        label: data.indicator.name,
        data: sortedData.map(point => Number(point.value) || null),
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
    options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          mode: 'index' as const,
          intersect: false,
          callbacks: {
            title: function(context: any) {
              // Use the label, which is the date string from the labels array
              return context[0].label || 'Unknown Date';
            },
            label: function(context: any) {
              const value = context?.raw;
              if (value === null || value === undefined || isNaN(value)) {
                return `${data?.indicator?.name || 'Value'}: N/A`;
              }
              try {
                const formattedValue = Math.abs(value) < 0.01 ? value.toExponential(2) : value.toFixed(2);
                // Only show the unit if it's not 'index'
                const unit = data?.indicator?.unit?.toLowerCase() === 'index' ? '' : data?.indicator?.unit || '';
                return `${data?.indicator?.name || 'Value'}: ${formattedValue}${unit}`;
              } catch (error) {
                console.error('Error formatting value:', error);
                return `${data?.indicator?.name || 'Value'}: ${value}`;
              }
            }
          }
        }
      },
      scales: {
        x: {
          display: true,
          grid: { display: false }
        },
        y: {
          display: true,
          grid: { color: '#f0f0f0' }
        }
      }
    };
  }

  // Debug: log chartData and options
  console.log('DetailChart chartData:', chartData);
  console.log('DetailChart options:', options);

  return <Line data={chartData} options={options} />;
};

export default DetailChart;