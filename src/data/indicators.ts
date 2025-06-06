import { EconomicIndicator } from '../types';

export const economicIndicators: EconomicIndicator[] = [
  {
    id: 'unemployment',
    name: 'Unemployment Rate',
    description: 'Percentage of the labor force that is unemployed and actively seeking employment',
    unit: '%',
    source: 'fred',
    sourceUrl: 'https://fred.stlouisfed.org/series/UNRATE',
    frequency: 'monthly',
    higherIsBetter: false,
    seriesId: 'UNRATE',
    transform: 'none'
  },
  {
    id: 'gdp-growth',
    name: 'GDP Growth Rate',
    description: 'Quarterly percent change in real Gross Domestic Product (GDP), seasonally adjusted annual rate',
    unit: '%',
    source: 'fred',
    sourceUrl: 'https://www.bea.gov/data/gdp/gross-domestic-product',
    frequency: 'quarterly',
    higherIsBetter: true,
    seriesId: 'BEA_GDP',
    transform: 'percent_change'
  },
  {
    id: 'job-creation',
    name: 'Total Nonfarm Employment',
    description: 'Total number of U.S. workers',
    unit: 'million jobs',
    source: 'fred',
    sourceUrl: 'https://fred.stlouisfed.org/series/PAYEMS',
    frequency: 'monthly',
    higherIsBetter: true,
    seriesId: 'PAYEMS',
    transform: 'none'
  },
  {
    id: 'federal-debt',
    name: 'Federal Debt to GDP',
    description: 'Federal debt as a percentage of GDP',
    unit: '%',
    source: 'fred',
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
    source: 'fred',
    sourceUrl: 'https://fred.stlouisfed.org/series/GASREGW',
    frequency: 'monthly',
    higherIsBetter: false,
    seriesId: 'GASREGW',
    transform: 'none'
  },
  {
    id: 'median-income',
    name: 'Real Median Household Income',
    description: 'Inflation-adjusted median household income',
    unit: '$',
    source: 'fred',
    sourceUrl: 'https://fred.stlouisfed.org/series/MEHOINUSA672N',
    frequency: 'annual',
    higherIsBetter: true,
    seriesId: 'MEHOINUSA672N',
    transform: 'none'
  },
  {
    id: 'stock-market',
    name: 'S&P 500 Index',
    description: 'Stock market performance measured by the S&P 500 index',
    unit: 'index',
    source: 'fred',
    sourceUrl: 'https://fred.stlouisfed.org/series/SP500',
    frequency: 'monthly',
    higherIsBetter: true,
    seriesId: 'SP500',
    transform: 'none'
  },
  {
    id: 'egg-prices',
    name: 'Egg Prices',
    description: 'Average Price: Eggs, Grade A, Large (Cost per Dozen) in U.S. City Average',
    unit: '$/dozen',
    source: 'fred',
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
    source: 'fred',
    sourceUrl: 'https://fred.stlouisfed.org/series/DCOILWTICO',
    frequency: 'monthly',
    higherIsBetter: false,
    seriesId: 'DCOILWTICO',
    transform: 'none'
  },
  {
    id: 'mortgage-30yr',
    name: '30-Year Fixed Rate Mortgage Average',
    description: 'Average interest rate for 30-year fixed-rate mortgages in the United States',
    unit: '%',
    source: 'fred',
    sourceUrl: 'https://fred.stlouisfed.org/series/MORTGAGE30US',
    frequency: 'monthly',
    higherIsBetter: false,
    seriesId: 'MORTGAGE30US',
    transform: 'none'
  },
  {
    id: 'cpi',
    name: 'Consumer Price Index (12-Month % Change)',
    description: '12-month percent change in Consumer Price Index for All Urban Consumers (CPI-U)',
    unit: '%',
    source: 'bls',
    sourceUrl: 'https://www.bls.gov/cpi/',
    frequency: 'monthly',
    higherIsBetter: false,
    seriesId: 'CPI_12M_CHANGE',
    transform: 'none'
  },
  {
    id: 'umich-consumer-sentiment',
    name: 'UMich Consumer Sentiment',
    description: 'University of Michigan Consumer Sentiment Index (monthly, CSV upload)',
    unit: 'index',
    source: 'fred',
    sourceUrl: '',
    frequency: 'monthly',
    higherIsBetter: true,
    seriesId: '',
    transform: 'none'
  }
];