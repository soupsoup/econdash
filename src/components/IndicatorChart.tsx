
import React from 'react';
import ReactApexChart from 'react-apexcharts';
import { IndicatorData } from '../types';
import { presidents } from '../data/presidents';

interface IndicatorChartProps {
  data: IndicatorData;
}

const IndicatorChart: React.FC<IndicatorChartProps> = ({ data }) => {
  const series = [{
    name: data.indicator.name,
    data: data.data.map(point => ([
      new Date(point.date).getTime(),
      point.value
    ]))
  }];

  const options = {
    chart: {
      type: 'area',
      height: 400,
      animations: {
        enabled: true
      },
      toolbar: {
        show: false
      },
      fontFamily: 'system-ui, -apple-system, sans-serif'
    },
    dataLabels: {
      enabled: false
    },
    stroke: {
      curve: 'smooth',
      width: 2,
      colors: ['#2563eb']
    },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 0.8,
        opacityFrom: 0.3,
        opacityTo: 0.1,
        stops: [0, 90, 100]
      },
      colors: ['#2563eb']
    },
    grid: {
      borderColor: '#f1f5f9',
      strokeDashArray: 4,
      xaxis: {
        lines: {
          show: false
        }
      }
    },
    xaxis: {
      type: 'datetime',
      labels: {
        rotate: -45,
        format: 'MMM yyyy',
        style: {
          fontSize: '10px'
        }
      },
      tooltip: {
        enabled: true
      }
    },
    tooltip: {
      x: {
        format: 'MMM yyyy'
      }
    },
    annotations: {
      xaxis: presidents.map(president => ({
        x: new Date(president.term.start).getTime(),
        x2: president.term.end
          ? new Date(president.term.end).getTime()
          : new Date().getTime(),
        borderColor: president.party === 'Democratic' ? '#2563eb' : '#dc2626',
        strokeDashArray: 5,
        borderWidth: 1,
        opacity: 0.1,
        label: {
          text: `${president.name}\n${new Date(president.term.start).getFullYear()}–${president.term.end ? new Date(president.term.end).getFullYear() : '2025'}`,
          position: 'bottom',
          style: {
            color: president.party === 'Democratic' ? '#2563eb' : '#dc2626',
            fontSize: '14px',
            fontWeight: 600,
            background: 'transparent'
          }
        }
      }))
    },
    colors: ['#3b82f6']
  };

  return (
    <div style={{ height: '400px', position: 'relative' }}>
      <ReactApexChart 
        options={options}
        series={series}
        type="area"
        height={400}
      />
    </div>
  );
};

export default IndicatorChart;
