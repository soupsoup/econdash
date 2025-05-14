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
  console.log('Rendering IndicatorChart');
  
  if (!data || !data.indicator) {
    return <div className="text-gray-500 text-center py-8">No data available</div>;
  }
  
  const { indicator, data: dataPoints } = data;
  
  // Use all available data points
  const filteredData = dataPoints;
  
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
  
  // Helper to get quarter label
  function getQuarterLabel(dateString: string) {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = date.getMonth();
    const quarter = Math.floor(month / 3) + 1;
    return `Q${quarter} ${year}`;
  }

  const isGDP = indicator.id === 'GDPC1' || indicator.name.toLowerCase().includes('gdp');

  // For GDP, build a map of quarter labels to values
  let gdpLabels: string[] = [];
  let gdpDataByPresident: { [presidencyId: string]: (number | null)[] } = {};
  if (isGDP) {
    gdpLabels = filteredData.map(point => getQuarterLabel(point.date));
    presidentGroups.forEach(group => {
      gdpDataByPresident[group.presidencyId] = gdpLabels.map((label, idx) => {
        const point = filteredData[idx];
        const pointDate = new Date(point.date);
        const startDate = new Date(group.president.term.start);
        const endDate = group.president.term.end ? new Date(group.president.term.end) : new Date();
        if (pointDate >= startDate && pointDate < endDate) {
          return point.value;
        }
        return null;
      });
    });
  }

  // Prepare chart data
  const chartData = isGDP
    ? {
        labels: gdpLabels,
        datasets: presidentGroups.map(group => ({
          label: `${group.president.name} (${group.president.term.start.substring(0, 4)}-${group.president.term.end ? group.president.term.end.substring(0, 4) : 'Present'})`,
          data: gdpDataByPresident[group.presidencyId],
          borderColor: group.president.color,
          backgroundColor: `${group.president.color}33`,
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 4,
          tension: 0.3,
          spanGaps: true,
        }))
      }
    : {
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
            if (pointDate >= startDate && pointDate < endDate) {
              return point.value;
            }
            return null;
          }),
          borderColor: group.president.color,
          backgroundColor: `${group.president.color}33`,
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 4,
          tension: 0.3,
          spanGaps: true,
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
        callbacks: isGDP
          ? {
              title: function(context) {
                return context[0].label;
              }
            }
          : undefined,
      },
    },
    scales: {
      x: isGDP
        ? {
            display: true,
            grid: { display: false },
            type: 'category',
            offset: true,
            ticks: {
              maxRotation: 0,
              autoSkip: false,
              font: { size: 10 }
            }
          }
        : {
            display: true,
            grid: { display: false },
            type: 'time',
            time: {
              unit: 'month',
              displayFormats: { month: 'MMM yyyy' }
            },
            ticks: {
              maxRotation: 0,
              autoSkip: true,
              maxTicksLimit: 12,
              font: { size: 10 }
            }
          },
      y: {
        display: true,
        grid: { color: '#f0f0f0' },
        ticks: { font: { size: 10 } }
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    },
    elements: {
      line: { borderWidth: 2 },
      point: { radius: 0, hoverRadius: 4 }
    }
  };
  
  // Debug: log chartData and options
  console.log('IndicatorChart chartData:', chartData);
  console.log('IndicatorChart options:', options);
  
  return <Line data={chartData} options={options} />;
};

export default IndicatorChart;