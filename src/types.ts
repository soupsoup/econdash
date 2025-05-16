export interface EconomicIndicator {
  id: string;
  name: string;
  description: string;
  unit: string;
  source: 'fred' | 'bls' | 'census' | 'metal';
  sourceUrl: string;
  frequency: 'monthly' | 'quarterly' | 'annual';
  higherIsBetter: boolean;
  seriesId: string;
  transform: 'none' | 'percent_change' | 'yoy';
  csvData?: IndicatorDataPoint[]; // Optional CSV fallback data
}

export interface IndicatorDataPoint {
  date: string;
  value: number;
  president?: string;
}

export interface IndicatorData {
  indicator: EconomicIndicator;
  data: IndicatorDataPoint[];
  source: 'api' | 'cache' | 'csv'; // Add source field
} 