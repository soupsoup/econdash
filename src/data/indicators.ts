import { EconomicIndicator } from '../types';

export const economicIndicators: EconomicIndicator[] = [
  {
    id: 'unemployment',
    name: 'Unemployment Rate',
    description: 'Percentage of the labor force that is unemployed and actively seeking employment',
    unit: '%',
    source: 'FederalReserve',
    sourceUrl: 'https://fred.stlouisfed.org/series/UNRATE',
    frequency: 'monthly',
    higherIsBetter: false,
    seriesId: 'UNRATE'
  },
  {
    id: 'monthly-inflation',
    name: 'Monthly Inflation Rate',
    description: 'Month-over-month percentage change in Consumer Price Index for All Urban Consumers (CPI-U)',
    unit: '%',
    source: 'FederalReserve',
    sourceUrl: 'https://fred.stlouisfed.org/series/CPIAUCSL',
    frequency: 'monthly',
    higherIsBetter: false,
    seriesId: 'CPIAUCSL'
  },
  {
    id: 'gdp-growth',
    name: 'GDP Growth Rate',
    description: 'Annual percentage change in real Gross Domestic Product',
    unit: '%',
    source: 'FederalReserve',
    sourceUrl: 'https://fred.stlouisfed.org/series/A191RL1Q225SBEA',
    frequency: 'quarterly',
    higherIsBetter: true,
    seriesId: 'A191RL1Q225SBEA'
  },
  {
    id: 'job-creation',
    name: 'Total Nonfarm Employment',
    description: 'Total number of U.S. workers',
    unit: 'million jobs',
    source: 'FederalReserve',
    sourceUrl: 'https://fred.stlouisfed.org/series/PAYEMS',
    frequency: 'monthly',
    higherIsBetter: true,
    seriesId: 'PAYEMS'
  },
  {
    id: 'federal-debt',
    name: 'Federal Debt to GDP',
    description: 'Federal debt as a percentage of GDP',
    unit: '%',
    source: 'FederalReserve',
    sourceUrl: 'https://fred.stlouisfed.org/series/GFDEGDQ188S',
    frequency: 'quarterly',
    higherIsBetter: false,
    seriesId: 'GFDEGDQ188S'
  },
  {
    id: 'gas-prices',
    name: 'Average Gas Price',
    description: 'U.S. regular all formulations retail gasoline prices',
    unit: '$/gallon',
    source: 'FederalReserve',
    sourceUrl: 'https://fred.stlouisfed.org/series/GASREGW',
    frequency: 'weekly',
    higherIsBetter: false,
    seriesId: 'GASREGW'
  },
  {
    id: 'median-income',
    name: 'Real Median Household Income',
    description: 'Inflation-adjusted median household income',
    unit: '$',
    source: 'FederalReserve',
    sourceUrl: 'https://fred.stlouisfed.org/series/MEHOINUSA672N',
    frequency: 'yearly',
    higherIsBetter: true,
    seriesId: 'MEHOINUSA672N'
  },
  {
    id: 'stock-market',
    name: 'S&P 500 Index',
    description: 'Stock market performance measured by the S&P 500 index',
    unit: 'index',
    source: 'FederalReserve',
    sourceUrl: 'https://fred.stlouisfed.org/series/SP500',
    frequency: 'daily',
    higherIsBetter: true,
    seriesId: 'SP500'
  },
  {
    id: 'cpi',
    name: 'Consumer Price Index',
    description: 'Consumer Price Index for All Urban Consumers: All Items (Base: 1982-84=100)',
    unit: 'index',
    source: 'FederalReserve',
    sourceUrl: 'https://fred.stlouisfed.org/series/CPIAUCSL',
    frequency: 'monthly',
    higherIsBetter: false,
    seriesId: 'CPIAUCSL'
  }
];