import React, { useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartArea,
  Chart,
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

interface IndicatorChartProps {
  data: IndicatorData;
}

const IndicatorChart: React.FC<IndicatorChartProps> = ({ data }) => {
  const chartRef = useRef<Chart<"line">>(null);
  const { indicator, data: dataPoints } = data;

  // Format dates for labels
  const labels = dataPoints.map(point => {
    const date = new Date(point.date);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric',
      month: 'short'
    });
  });

  // Create dataset
  const chartData = {
    labels,
    datasets: [{
      label: indicator.name,
      data: dataPoints.map(point => point.value),
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
  const presidentalTermsPlugin = {
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

        if (!isNaN(startPixel) && !isNaN(endPixel)) {
          // Draw background
          ctx.fillStyle = `${president.color}15`;
          ctx.fillRect(
            startPixel,
            chartArea.top,
            endPixel - startPixel,
            chartArea.bottom - chartArea.top
          );

          // Draw president name
          ctx.save();
          ctx.fillStyle = president.color;
          ctx.font = '12px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'top';

          // Draw name at top of chart
          ctx.fillText(
            president.name,
            startPixel + (endPixel - startPixel) / 2,
            chartArea.top + 10
          );

          // Draw term years
          ctx.font = '10px Arial';
          ctx.fillText(
            `${startDate.getFullYear()}-${endDate.getFullYear()}`,
            startPixel + (endPixel - startPixel) / 2,
            chartArea.top + 25
          );

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
              const date = new Date(dataPoints[items[0].dataIndex].date);
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
        }
      }
    }
  };

  return (
    <div style={{ height: '400px', position: 'relative' }}>
      <Line
        ref={chartRef}
        data={chartData}
        options={options}
        plugins={[presidentalTermsPlugin]}
      />
    </div>
  );
};

export default IndicatorChart;