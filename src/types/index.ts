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
  source: 'BLS' | 'FederalReserve' | 'EIA';
  sourceUrl: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  higherIsBetter: boolean;
}

export interface IndicatorDataPoint {
  date: string;
  value: number;
  president: string;
}

export interface IndicatorData {
  indicator: EconomicIndicator;
  data: IndicatorDataPoint[];
  lastUpdated: string;
}