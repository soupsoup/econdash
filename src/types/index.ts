export interface President {
  name: string;
  party: 'Democratic' | 'Republican';
  term: {
    start: string;
    end: string | null;
  };
  color: string;
}

export interface EconomicIndicator {
  id: string;
  name: string;
  description: string;
  unit: string;
  source: string;
  sourceUrl: string;
  frequency: string;
  higherIsBetter: boolean;
  seriesId: string;
  transform?: 'none' | 'pct_change' | 'pct_change_year' | 'divide_by_1000';
}

export interface IndicatorDataPoint {
  date: string;
  value: number;
  president?: string;
  percentageChange?: number; // Month-over-month percentage change for inflation data
  originalValue?: number; // Original value before any transformations
}

export interface IndicatorData {
  indicator: EconomicIndicator;
  data: IndicatorDataPoint[];
  lastUpdated?: string;
}