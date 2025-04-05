
import React, { useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Chart
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { IndicatorData } from '../types';
import { presidents } from '../data/presidents';

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
  const chartRef = useRef<Chart<"line">>(null);
  const sortedData = [...filteredData].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Format dates for labels
  const labels = sortedData.map(point => {
    const date = new Date(point.date);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric',
      month: 'short'
    });
  });

  const chartData = {
    labels,
    datasets: [{
      label: data.indicator.name,
      data: sortedData.map(point => point.value),
      borderColor: '#2563eb',
      backgroundColor: '#2563eb20',
      borderWidth: 2,
      fill: true,
      tension: 0.4,
      pointRadius: 0,
      pointHoverRadius: 6,
    }]
  };

  // Custom plugin to draw presidential terms
  const presidentialTermsPlugin = {
    id: 'presidentialTerms',
    beforeDraw(chart: Chart) {
      const { ctx, chartArea, scales } = chart;
      if (!chartArea) return;

      // Draw presidential terms
      presidents.forEach(president => {
        const startDate = new Date(president.term.start);
        const endDate = president.term.end ? new Date(president.term.end) : new Date();

        // Find corresponding pixels on chart
        const startPixel = scales.x.getPixelForValue(
          startDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
        );
        const endPixel = scales.x.getPixelForValue(
          endDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
        );

        if (startPixel && endPixel) {
          // Draw background
          ctx.fillStyle = president.party === 'Democratic' ? '#1450C41A' : '#C414141A';
          ctx.fillRect(startPixel, chartArea.top, endPixel - startPixel, chartArea.height);

          // Draw president name
          ctx.save();
          ctx.textAlign = 'center';
          ctx.fillStyle = '#666';
          ctx.font = '10px Arial';
          ctx.fillText(president.name, startPixel + (endPixel - startPixel) / 2, chartArea.top + 12);
          ctx.restore();
        }
      });
    }
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        callbacks: {
          afterTitle: (items: any[]) => {
            if (items.length > 0) {
              const date = new Date(sortedData[items[0].dataIndex].date);
              const president = presidents.find(p => {
                const startDate = new Date(p.term.start);
                const endDate = p.term.end ? new Date(p.term.end) : new Date();
                return date >= startDate && date < endDate;
              });
              return president ? `President: ${president.name}` : '';
            }
            return '';
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          maxRotation: 45,
          autoSkip: true,
          maxTicksLimit: 12
        }
      },
      y: {
        beginAtZero: false,
        grid: {
          color: '#f0f0f0'
        },
        title: {
          display: true,
          text: data.indicator.unit
        }
      }
    }
  };

  return (
    <Line
      ref={chartRef}
      data={chartData}
      options={options}
      plugins={[presidentialTermsPlugin]}
    />
  );
};

export default DetailChart;
