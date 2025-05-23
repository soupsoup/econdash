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
import { presidents } from '../data/presidents';
import 'chartjs-adapter-date-fns';

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

interface IndicatorChartProps {
  data: IndicatorData;
}

const IndicatorChart: React.FC<IndicatorChartProps> = ({ data }) => {
  if (!data || !data.indicator) {
    return <div className="text-gray-500 text-center py-8">No data available</div>;
  }
  
  const { indicator, data: dataPoints } = data;
  
  // Filter data to show only the last 10 years
  const tenYearsAgo = new Date();
  tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);
  const filteredData = dataPoints.filter(point => new Date(point.date) >= tenYearsAgo);
  
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
      return date.toLocaleDateString(undefined, { year: '2-digit', month: 'short' });
    }),
    datasets: presidentGroups.map(group => ({
      label: `${group.president.name} (${group.president.term.start.substring(0, 4)}-${group.president.term.end ? group.president.term.end.substring(0, 4) : 'Present'})`,
      data: filteredData.map(point => {
        const pointDate = new Date(point.date);
        const startDate = new Date(group.president.term.start);
        const endDate = group.president.term.end ? new Date(group.president.term.end) : new Date();
        
        // Only include data points that fall within this president's term
        if (pointDate >= startDate && pointDate < endDate) {
          return point.value;
        }
        return null; // Return null for points outside the president's term
      }),
      borderColor: group.president.color,
      backgroundColor: `${group.president.color}33`,
      borderWidth: 2,
      pointRadius: 0,
      pointHoverRadius: 4,
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
            size: 10
          }
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      },
    },
    scales: {
      x: {
        display: true,
        grid: {
          display: false
        },
        ticks: {
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 6,
          font: {
            size: 10
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
            size: 10
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
        radius: 0,
        hoverRadius: 4
      }
    }
  };
  
  return <Line data={chartData} options={options} />;
};

export default IndicatorChart;