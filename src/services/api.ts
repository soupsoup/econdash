import { format } from 'date-fns';
import { IndicatorData, IndicatorDataPoint } from '../types';
import { economicIndicators } from '../data/indicators';

const LOCAL_STORAGE_PREFIX = 'presidential_dashboard_';
const FRED_API_BASE_URL = 'https://api.stlouisfed.org/fred/series/observations';

async function fetchFredData(series: string): Promise<IndicatorDataPoint[]> {
  const params = new URLSearchParams({
    series_id: series,
    api_key: import.meta.env.VITE_FRED_API_KEY,
    file_type: 'json',
    observation_start: '1950-01-01',
    frequency: 'm',
    aggregation_method: 'avg',
    sort_order: 'desc'
  });

  console.log('Fetching FRED data:', `${FRED_API_BASE_URL}?${params.toString()}`);
  
  // BLS API request for unemployment data
  const BLS_API_BASE_URL = 'https://api.bls.gov/publicAPI/v2/timeseries/data';
  const blsParams = new URLSearchParams({
    seriesid: 'LNS14000000',
    startyear: '1950',
    endyear: new Date().getFullYear().toString(),
    registrationkey: 'ce15238949e14526b9b13c2ff4beabfc',
    catalog: 'false',
    calculations: 'false',
    annualaverage: 'false'
  });

  const response = await fetch(
    `${BLS_API_BASE_URL}?${blsParams.toString()}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    }
  );
  
  if (!response.ok) {
    console.warn(`API request failed (${response.status}), falling back to local storage`);
    const localData = getFromLocalStorage(`indicator-${indicatorId}`);
    if (localData) {
      return localData.data;
    }
    const errorText = await response.text();
    throw new Error(`API Error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  return data.observations.map((point: any) => ({
    date: point.date,
    value: parseFloat(point.value),
    president: '' // Will be filled by data processing logic
  }));
}

async function fetchTradingEconomicsData(series: string): Promise<IndicatorDataPoint[]> {
  const response = await fetch(
    `${TRADING_ECONOMICS_BASE_URL}/united states/${series}`
  );
  
  if (!response.ok) {
    throw new Error('Failed to fetch Trading Economics data');
  }

  const data = await response.json();
  return data.map((point: any) => ({
    date: point.DateTime,
    value: point.Value,
    president: '' // This will be filled in by the data processing logic
  }));
}
const LAST_UPDATED_KEY = `${LOCAL_STORAGE_PREFIX}last_updated`;
export const DATA_SOURCE_PREFERENCES_KEY = `${LOCAL_STORAGE_PREFIX}data_source_preferences`;

interface DataSourcePreference {
  useUploadedData: boolean;
}

export const getDataSourcePreferences = (): Record<string, DataSourcePreference> => {
  try {
    const stored = localStorage.getItem(DATA_SOURCE_PREFERENCES_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error('Error reading data source preferences:', error);
    return {};
  }
};

export const setDataSourcePreference = (indicatorId: string, preference: DataSourcePreference): void => {
  try {
    const preferences = getDataSourcePreferences();
    preferences[indicatorId] = preference;
    localStorage.setItem(DATA_SOURCE_PREFERENCES_KEY, JSON.stringify(preferences));
  } catch (error) {
    console.error('Error saving data source preference:', error);
  }
};

export const fetchIndicatorData = async (indicatorId: string): Promise<IndicatorData> => {
  console.log('fetchIndicatorData called with ID:', indicatorId);
  
  if (!indicatorId) {
    console.error('Missing indicatorId');
    throw new Error('Indicator ID is required');
  }

  if (indicatorId === 'inflation') {
    try {
      const data = await fetchFredData('CPIAUCSL');
      const indicator = economicIndicators.find(i => i.id === indicatorId);
      if (!indicator) throw new Error('Indicator not found');
      
      return {
        indicator,
        data,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error fetching FRED data:', error);
      throw error;
    }
  }

  const localStorageKey = `indicator-${indicatorId}`;
  console.log('Checking localStorage key:', LOCAL_STORAGE_PREFIX + localStorageKey);
  
  const storedData = getFromLocalStorage(localStorageKey);
  console.log('Retrieved stored data:', {
    exists: !!storedData,
    timestamp: storedData?.timestamp,
    hasData: !!storedData?.data,
    dataPoints: storedData?.data?.data?.length
  });

  if (!storedData) {
    console.error('No stored data found for indicator:', indicatorId);
    throw new Error('No data found. Please upload data first.');
  }

  return storedData.data;
};

export const fetchAllIndicatorsData = async (): Promise<IndicatorData[]> => {
  const results: IndicatorData[] = [];

  for (const indicator of economicIndicators) {
    const localStorageKey = `indicator-${indicator.id}`;
    const storedData = getFromLocalStorage(localStorageKey);

    if (storedData) {
      results.push(storedData.data);
    }
  }

  if (results.length === 0) {
    throw new Error('No data found. Please upload data for at least one indicator.');
  }

  return results;
};

const getFromLocalStorage = (key: string): { data: any; timestamp: number } | null => {
  try {
    const serializedData = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}${key}`);
    if (!serializedData) return null;
    return JSON.parse(serializedData);
  } catch (error) {
    console.error(`Error retrieving from local storage: ${key}`, error);
    return null;
  }
};

export const checkForDataUpdates = async (): Promise<boolean> => {
  return false; // No API updates to check for
};

export const getLastUpdatedTimestamp = (): string | null => {
  try {
    const timestamp = localStorage.getItem(LAST_UPDATED_KEY);
    if (!timestamp) return null;
    return format(new Date(parseInt(timestamp)), 'yyyy-MM-dd');
  } catch (error) {
    console.error('Error getting last updated timestamp:', error);
    return null;
  }
};

export const clearAllStoredData = (): void => {
  try {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(LOCAL_STORAGE_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
    console.log('All stored data cleared');
  } catch (error) {
    console.error('Error clearing stored data:', error);
  }
};

export const updateIndicatorData = (indicatorId: string, newData: IndicatorDataPoint[], source: 'api' | 'upload' = 'upload'): void => {
  const indicator = economicIndicators.find(ind => ind.id === indicatorId);
  if (!indicator) throw new Error(`Invalid indicator ID: ${indicatorId}`);

  const localStorageKey = `indicator-${indicatorId}`;
  const result = {
    indicator,
    data: newData,
    lastUpdated: format(new Date(), 'yyyy-MM-dd'),
  };

  localStorage.setItem(`${LOCAL_STORAGE_PREFIX}${localStorageKey}`, JSON.stringify({
    data: result,
    timestamp: Date.now()
  }));
  localStorage.setItem(LAST_UPDATED_KEY, Date.now().toString());
  
  // Store data source information
  localStorage.setItem(`${LOCAL_STORAGE_PREFIX}data_source_${indicatorId}`, source);
  if (source === 'api') {
    localStorage.setItem(`${LOCAL_STORAGE_PREFIX}last_api_update_${indicatorId}`, Date.now().toString());
  }
};