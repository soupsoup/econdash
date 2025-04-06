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

  // Get date range from filtered data
  const dateRange = {
    start: new Date(filteredData[0]?.date || ''),
    end: new Date(filteredData[filteredData.length - 1]?.date || '')
  };

  // Group data by president, but only include presidents who were active during the filtered date range
  const presidentGroups = presidents
    .filter(president => {
      const termStart = new Date(president.term.start);
      const termEnd = president.term.end ? new Date(president.term.end) : new Date();
      // Only include presidents whose terms overlap with the data range
      return termStart <= dateRange.end && termEnd >= dateRange.start;
    })
    .map(president => {
      const presidencyId = `${president.name}-${president.term.start}`;

      // Only include data points that fall within this president's term
      const presidentData = filteredData.filter(point => {
        const pointDate = new Date(point.date);
        const startDate = new Date(president.term.start);
        const endDate = president.term.end ? new Date(president.term.end) : new Date();
        return pointDate >= startDate && pointDate < endDate;
      });

      if (presidentData.length === 0) {
        return null;
      }

      return {
        president,
        data: presidentData,
        presidencyId
      };
    })
    .filter(group => group.data.length > 0);

  // Prepare chart data
  const chartData = {
    labels: filteredData.map(point => {
      const date = new Date(point.date);
      return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short' });
    }),
    datasets: [{
      label: indicator.name,
      data: filteredData.map(point => point.value),
      borderColor: filteredData.map(point => {
        const date = new Date(point.date);
        const president = presidents.find(p => {
          const startDate = new Date(p.term.start);
          const endDate = p.term.end ? new Date(p.term.end) : new Date();
          return date >= startDate && date < endDate;
        });
        return president?.color || '#999999';
      }),
      segment: {
        borderColor: (ctx) => {
          if (!ctx.p0.parsed || !ctx.p1.parsed) return '#999999';
          const date0 = new Date(filteredData[ctx.p0.index].date);
          const date1 = new Date(filteredData[ctx.p1.index].date);
          const president0 = presidents.find(p => {
            const startDate = new Date(p.term.start);
            const endDate = p.term.end ? new Date(p.term.end) : new Date();
            return date0 >= startDate && date0 < endDate;
          });
          const president1 = presidents.find(p => {
            const startDate = new Date(p.term.start);
            const endDate = p.term.end ? new Date(p.term.end) : new Date();
            return date1 >= startDate && date1 < endDate;
          });
          return president0 === president1 ? president0?.color : 'transparent';
        }
      },
      backgroundColor: 'transparent',
      borderWidth: 2,
      pointRadius: 2,
      pointHoverRadius: 6,
      tension: 0.3
    }]
  };

  // Chart options
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
            const date = new Date(filteredData[context[0].dataIndex].date);
            const president = presidents.find(p => {
              const startDate = new Date(p.term.start);
              const endDate = p.term.end ? new Date(p.term.end) : new Date();
              return date >= startDate && date < endDate;
            });
            return `${date.toLocaleDateString()} (${president?.name || 'Unknown'})`;
          },
          label: function(context) {
            return `${indicator.name}: ${context.parsed.y.toFixed(2)}${indicator.unit}`;
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