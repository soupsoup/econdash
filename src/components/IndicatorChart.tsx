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
      height: 350,
      animations: {
        enabled: true
      },
      toolbar: {
        show: false
      }
    },
    dataLabels: {
      enabled: false
    },
    stroke: {
      curve: 'smooth',
      width: 2
    },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.3,
        opacityTo: 0.1,
        stops: [0, 100]
      }
    },
    xaxis: {
      type: 'datetime',
      labels: {
        datetimeFormatter: {
          year: 'yyyy',
          month: 'MMM yyyy'
        }
      }
    },
    annotations: {
      xaxis: presidents.map(president => ({
        x: new Date(president.term.start).getTime(),
        x2: president.term.end ? new Date(president.term.end).getTime() : new Date().getTime(),
        fillColor: president.party === 'Democratic' ? '#1450C41A' : '#C414141A',
        opacity: 0.1,
        label: {
          text: president.name,
          style: {
            fontSize: '10px',
            color: '#666'
          }
        }
      }))
    },
    tooltip: {
      x: {
        format: 'MMM yyyy'
      }
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