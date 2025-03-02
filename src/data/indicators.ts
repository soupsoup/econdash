import { EconomicIndicator } from '../types';

export const economicIndicators: EconomicIndicator[] = [
  {
    id: 'unemployment',
    name: 'Unemployment Rate',
    description: 'Percentage of the labor force that is unemployed and actively seeking employment',
    unit: '%',
    source: 'BLS',
    sourceUrl: 'https://www.bls.gov/charts/employment-situation/civilian-unemployment-rate.htm',
    frequency: 'monthly',
    higherIsBetter: false
  },
  {
    id: 'inflation',
    name: 'Inflation Rate (CPI)',
    description: 'Annual percentage change in the Consumer Price Index for All Urban Consumers',
    unit: '%',
    source: 'BLS',
    sourceUrl: 'https://www.bls.gov/charts/consumer-price-index/consumer-price-index-by-category-line-chart.htm',
    frequency: 'monthly',
    higherIsBetter: false
  },
  {
    id: 'gdp-growth',
    name: 'GDP Growth Rate',
    description: 'Annual percentage change in real Gross Domestic Product',
    unit: '%',
    source: 'FederalReserve',
    sourceUrl: 'https://fred.stlouisfed.org/series/A191RL1Q225SBEA',
    frequency: 'quarterly',
    higherIsBetter: true
  },
  {
    id: 'job-creation',
    name: 'Job Creation',
    description: 'Monthly change in nonfarm payroll employment',
    unit: 'jobs',
    source: 'BLS',
    sourceUrl: 'https://www.bls.gov/charts/employment-situation/civilian-unemployment-rate.htm',
    frequency: 'monthly',
    higherIsBetter: true
  },
  {
    id: 'federal-debt',
    name: 'Federal Debt to GDP',
    description: 'Federal debt as a percentage of GDP',
    unit: '%',
    source: 'FederalReserve',
    sourceUrl: 'https://fred.stlouisfed.org/series/GFDEGDQ188S',
    frequency: 'quarterly',
    higherIsBetter: false
  },
  {
    id: 'gas-prices',
    name: 'Average Gas Price',
    description: 'U.S. regular all formulations retail gasoline prices',
    unit: '$/gallon',
    source: 'EIA',
    sourceUrl: 'https://www.eia.gov/dnav/pet/pet_pri_gnd_dcus_nus_w.htm',
    frequency: 'weekly',
    higherIsBetter: false
  },
  {
    id: 'median-income',
    name: 'Real Median Household Income',
    description: 'Inflation-adjusted median household income',
    unit: '$',
    source: 'FederalReserve',
    sourceUrl: 'https://fred.stlouisfed.org/series/MEHOINUSA672N',
    frequency: 'yearly',
    higherIsBetter: true
  },
  {
    id: 'stock-market',
    name: 'S&P 500 Index',
    description: 'Stock market performance measured by the S&P 500 index',
    unit: 'index',
    source: 'FederalReserve',
    sourceUrl: 'https://fred.stlouisfed.org/series/SP500',
    frequency: 'daily',
    higherIsBetter: true
  }
];