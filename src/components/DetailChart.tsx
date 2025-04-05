import React from 'react';
import ReactApexChart from 'react-apexcharts';
import { IndicatorData } from '../types';
import { presidents } from '../data/presidents';

interface DetailChartProps {
  data: IndicatorData;
  filteredData: any[];
}

const DetailChart: React.FC<DetailChartProps> = ({ data, filteredData }) => {
  const sortedData = [...filteredData].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const series = [{
    name: data.indicator.name,
    data: sortedData.map(point => ([
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
        show: true
      }
    },
    dataLabels: {
      enabled: false
    },
    stroke: {
      curve: 'smooth',
      width: 2.5
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
    yaxis: {
      title: {
        text: data.indicator.unit
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
    <ReactApexChart 
      options={options}
      series={series}
      type="area"
      height={350}
    />
  );
};

export default DetailChart;