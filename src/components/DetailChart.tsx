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
import { presidents } from '../data/presidents';

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
  const { indicator } = data;
  
  // Group data by president
  const presidentGroups = presidents.map(president => {
    // Create a unique ID for each presidency using the term start date
    const presidencyId = `${president.name}-${president.term.start}`;
    
    // Filter data points that fall within this president's term
    const presidentData = filteredData.filter(point => {
      const pointDate = new Date(point.date);
      const startDate = new Date(president.term.start);
      const endDate = president.term.end ? new Date(president.term.end) : new Date();
      return pointDate >= startDate && pointDate < endDate;
    });
    
    return {
      president,
      data: presidentData,
      presidencyId
    };
  }).filter(group => group.data.length > 0);
  
  // Prepare chart data
  const chartData = {
    labels: filteredData.map(point => {
      const date = new Date(point.date);
      return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short' });
    }),
    
    // Set tooltip callbacks
    tooltip: {
      callbacks: {
        label: function(context) {
          const dataPoint = filteredData[context.dataIndex];
          if (indicator.id === 'job-creation' && 'originalValue' in dataPoint) {
            const monthlyChange = dataPoint.value;
            const totalJobs = dataPoint.originalValue;
            const prefix = monthlyChange > 0 ? '+' : '';
            return [
              `${context.dataset.label}: ${prefix}${Math.round(monthlyChange).toLocaleString()} jobs`,
              `Total: ${Math.round(totalJobs).toLocaleString()} jobs`
            ];
          }
          return `${context.dataset.label}: ${context.formattedValue}`;
        }
      }
    },
    datasets: presidentGroups.map(group => {
      // First filter the data points for this president's term
      const presidentData = filteredData.filter(point => {
        const pointDate = new Date(point.date);
        const startDate = new Date(group.president.term.start);
        const endDate = group.president.term.end ? new Date(group.president.term.end) : new Date();
        return pointDate >= startDate && pointDate < endDate;
      });
      
      return {
        label: `${group.president.name} (${group.president.term.start.substring(0, 4)}-${group.president.term.end ? group.president.term.end.substring(0, 4) : 'Present'})`,
        data: presidentData.map(point => point.value),
      borderColor: group.president.color,
      backgroundColor: `${group.president.color}33`,
      borderWidth: 2,
      pointRadius: 2,
      pointHoverRadius: 6,
      tension: 0.3,
      spanGaps: true, // This allows the line to skip null values
    }))
  };
  
  // Chart options
  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        labels: {
          boxWidth: 12,
          usePointStyle: true,
          pointStyle: 'circle',
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += context.parsed.y.toFixed(2) + ' ' + indicator.unit;
            }
            return label;
          }
        }
      },
    },
    scales: {
      x: {
        display: true,
        grid: {
          display: false
        },
        ticks: {
          maxRotation: 45,
          autoSkip: true,
          maxTicksLimit: 12,
          font: {
            size: 11
          }
        }
      },
      y: {
        display: true,
        grid: {
          color: '#f0f0f0'
        },
        ticks: {
          font: {
            size: 11
          },
          callback: function(value) {
            return value + ' ' + indicator.unit;
          }
        }
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    },
    elements: {
      line: {
        borderWidth: 2
      },
      point: {
        radius: 2,
        hoverRadius: 6
      }
    }
  };
  
  return <Line data={chartData} options={options} />;
};

export default DetailChart;