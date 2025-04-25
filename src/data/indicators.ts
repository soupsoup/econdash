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
    seriesId: 'UNRATE',
    transform: 'none'
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
    seriesId: 'CPIAUCSL',
    transform: 'pct_change'
  },
  {
    id: 'gdp-growth',
    name: 'GDP Growth Rate',
    description: 'Annual percentage change in real Gross Domestic Product',
    unit: '%',
    source: 'FederalReserve',
    sourceUrl: 'https://fred.stlouisfed.org/series/GDPC1',
    frequency: 'quarterly',
    higherIsBetter: true,
    seriesId: 'GDPC1',
    transform: 'pct_change_year'
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
    seriesId: 'PAYEMS',
    transform: 'divide_by_1000'
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
    seriesId: 'GFDEGDQ188S',
    transform: 'none'
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
    seriesId: 'GASREGW',
    transform: 'none'
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
    seriesId: 'MEHOINUSA672N',
    transform: 'none'
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
    seriesId: 'SP500',
    transform: 'none'
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
    seriesId: 'CPIAUCSL',
    transform: 'none'
  },
  {
    id: 'egg-prices',
    name: 'Egg Prices',
    description: 'Average Price: Eggs, Grade A, Large (Cost per Dozen) in U.S. City Average',
    unit: '$/dozen',
    source: 'FederalReserve',
    sourceUrl: 'https://fred.stlouisfed.org/series/APU0000708111',
    frequency: 'monthly',
    higherIsBetter: false,
    seriesId: 'APU0000708111',
    transform: 'none'
  },
  {
    id: 'crude-oil',
    name: 'Crude Oil Prices (WTI)',
    description: 'Crude Oil Prices: West Texas Intermediate (WTI) - Cushing, Oklahoma',
    unit: '$/barrel',
    source: 'FederalReserve',
    sourceUrl: 'https://fred.stlouisfed.org/series/DCOILWTICO',
    frequency: 'daily',
    higherIsBetter: false,
    seriesId: 'DCOILWTICO',
    transform: 'none'
  }
];