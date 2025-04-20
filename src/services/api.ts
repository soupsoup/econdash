import { format } from 'date-fns';
import { IndicatorData, IndicatorDataPoint, EconomicIndicator } from '../types';
import { economicIndicators } from '../data/indicators';
import axios from 'axios';

const LOCAL_STORAGE_PREFIX = 'economic_indicator_';
const LAST_UPDATED_PREFIX = 'last_updated_';
const FRED_API_BASE_URL = import.meta.env.PROD 
  ? '/.netlify/functions/fred-proxy/series/observations'
  : '/api/fred/series/observations';

// Debug logging (without sensitive info)
console.log('Environment Configuration:', {
  isProd: import.meta.env.PROD,
  baseUrl: FRED_API_BASE_URL,
  nodeEnv: process.env.NODE_ENV
});

export const LAST_UPDATED_KEY = `${LOCAL_STORAGE_PREFIX}last_updated`;
export const DATA_SOURCE_PREFERENCES_KEY = `${LOCAL_STORAGE_PREFIX}data_source_preferences`;

interface FredObservation {
  date: string;
  value: string;
  realtime_start?: string;
  realtime_end?: string;
}

interface FredResponse {
  observations: FredObservation[];
}

function formatFredData(observations: FredObservation[], indicator: EconomicIndicator): IndicatorDataPoint[] {
  return observations
    .map(point => ({
      date: point.date,
      value: parseFloat(point.value),
      president: '' // Will be filled by data processing logic
    }))
    .filter(point => !isNaN(point.value) && point.value !== null);
}

async function testFredApiKey(): Promise<boolean> {
  const apiKey = import.meta.env.VITE_FRED_API_KEY;
  if (!apiKey) {
    console.error('FRED API key is missing in environment variables');
    return false;
  }

  try {
    const testUrl = `https://api.stlouisfed.org/fred/series/observations?series_id=UNRATE&api_key=${apiKey}&file_type=json&limit=1`;
    console.log('Testing FRED API with URL:', testUrl);
    
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      mode: 'cors'
    });

    console.log('FRED API Test Response:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries())
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('FRED API Test Error:', errorText);
      return false;
    }

    const data = await response.json();
    console.log('FRED API Test Success:', data);
    return true;
  } catch (error) {
    console.error('FRED API Test Error:', error);
    return false;
  }
}

async function fetchFredData(series: string): Promise<IndicatorDataPoint[]> {
  const today = new Date().toISOString().split('T')[0];
  const params = new URLSearchParams({
    series_id: series,
    file_type: 'json',
    observation_start: '1950-01-01',
    observation_end: today,
    sort_order: 'desc',
    units: 'lin'
  });

  // Only add API key in development
  if (!import.meta.env.PROD && import.meta.env.VITE_FRED_API_KEY) {
    params.append('api_key', import.meta.env.VITE_FRED_API_KEY);
  }

  const url = `${FRED_API_BASE_URL}?${params.toString()}`;
  console.log('Fetching FRED data for series:', series);

  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error('FRED API Error:', {
        status: response.status,
        statusText: response.statusText,
        series
      });
      throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.observations || !Array.isArray(data.observations)) {
      console.error('Invalid FRED API response format for series:', series);
      throw new Error('Invalid response format from FRED API');
    }

    console.log(`Received ${data.observations.length} observations for ${series}`);

    // Convert observations to data points and filter out invalid values
    const dataPoints = data.observations
      .map((point: FredObservation) => ({
        date: point.date,
        value: parseFloat(point.value),
        president: '' // Will be filled by data processing logic
      }))
      .filter((point: IndicatorDataPoint) => !isNaN(point.value) && point.value !== null);

    // Calculate percentage changes for inflation data
    if (series === 'CPIAUCSL') {
      for (let i = 0; i < dataPoints.length - 1; i++) {
        const current = dataPoints[i].value;
        const previous = dataPoints[i + 1].value;
        dataPoints[i].percentageChange = ((current - previous) / previous) * 100;
      }
      dataPoints[dataPoints.length - 1].percentageChange = 0;
    }

    return dataPoints;
  } catch (error) {
    console.error('Error fetching FRED data:', {
      series,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
}

export interface DataSourcePreference {
  useUploadedData: boolean;
}

interface StoredData {
  data: IndicatorData;
  lastUpdated: string;
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
  const preferences = getDataSourcePreferences();
  const useUploadedData = preferences[indicatorId]?.useUploadedData || false;

  if (useUploadedData) {
    const uploadedData = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}uploaded_${indicatorId}`);
    if (!uploadedData) {
      throw new Error('No uploaded data available');
    }
    return JSON.parse(uploadedData);
  }

  try {
    // Try to fetch from API
    const indicator = economicIndicators.find(i => i.id === indicatorId);
    if (!indicator) throw new Error('Invalid indicator ID');

    const today = new Date().toISOString().split('T')[0];
    const params = new URLSearchParams({
      series_id: indicator.seriesId,
      observation_start: '1950-01-01',
      observation_end: today,
      sort_order: 'desc',
      units: 'lin'
    });

    // Log the request details
    console.log(`Fetching data for ${indicator.name}:`, {
      indicatorId,
      seriesId: indicator.seriesId,
      params: Object.fromEntries(params.entries()),
      baseUrl: FRED_API_BASE_URL,
      isProd: import.meta.env.PROD
    });

    const response = await axios.get<FredResponse>(`${FRED_API_BASE_URL}`, {
      params,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    console.log(`API Response for ${indicator.name}:`, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      url: response.config.url,
      dataSize: JSON.stringify(response.data).length,
      observationCount: response.data.observations?.length
    });

    if (!response.data || !Array.isArray(response.data.observations)) {
      console.error('Invalid API response:', response.data);
      throw new Error('Invalid API response format');
    }

    const formattedData = formatFredData(response.data.observations, indicator);
    const indicatorData = { indicator, data: formattedData };

    // Store API data locally with timestamp
    const storedData: StoredData = {
      data: indicatorData,
      lastUpdated: new Date().toISOString()
    };
    localStorage.setItem(`${LOCAL_STORAGE_PREFIX}api_${indicatorId}`, JSON.stringify(storedData));
    localStorage.setItem(`${LAST_UPDATED_PREFIX}${indicatorId}`, new Date().toISOString());

    return indicatorData;
  } catch (error: unknown) {
    console.error(`Error fetching ${indicatorId}:`, {
      error,
      message: error instanceof Error ? error.message : String(error),
      response: (error as any).response?.data,
      status: (error as any).response?.status,
      config: (error as any).config
    });
    
    // Try to use locally stored API data if available
    const storedData = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}api_${indicatorId}`);
    if (storedData) {
      const parsedData: StoredData = JSON.parse(storedData);
      console.log(`Using locally stored API data from ${parsedData.lastUpdated}`);
      return parsedData.data;
    }
    
    throw error;
  }
};

export const fetchAllIndicatorsData = async (): Promise<IndicatorData[]> => {
  console.log('Fetching all indicators data...');
  
  try {
    const results = await Promise.allSettled(
      economicIndicators.map(async indicator => {
        try {
          console.log(`Fetching data for ${indicator.name}...`);
          const data = await fetchIndicatorData(indicator.id);
          console.log(`Successfully fetched data for ${indicator.name}`);
          return data;
        } catch (error) {
          console.error(`Error fetching ${indicator.name}:`, error);
          // Try to get from localStorage as fallback
          const storedData = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}api_${indicator.id}`);
          if (storedData) {
            console.log(`Using cached data for ${indicator.name}`);
            return JSON.parse(storedData).data;
          }
          throw error;
        }
      })
    );

    const validData = results
      .map((result, index) => {
        if (result.status === 'fulfilled') {
          return result.value;
        } else {
          console.error(`Failed to fetch ${economicIndicators[index].name}:`, result.reason);
          return null;
        }
      })
      .filter((data): data is IndicatorData => data !== null);

    console.log(`Successfully fetched ${validData.length} out of ${economicIndicators.length} indicators`);
    return validData;
  } catch (error) {
    console.error('Error in fetchAllIndicatorsData:', error);
    throw error;
  }
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
  try {
    // Check if we have a last update timestamp
    const lastUpdate = localStorage.getItem(LAST_UPDATED_KEY);
    if (!lastUpdate) return true;

    const lastUpdateTime = parseInt(lastUpdate);
    const now = Date.now();
    
    // If it's been more than 6 hours since last update, trigger a refresh
    const SIX_HOURS = 6 * 60 * 60 * 1000;
    if (now - lastUpdateTime > SIX_HOURS) {
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error checking for updates:', error);
    return false;
  }
};

export const getLastUpdated = (indicatorId: string): string | null => {
  return localStorage.getItem(`${LAST_UPDATED_PREFIX}${indicatorId}`);
};

export const getLastUpdatedTimestamp = (indicatorId: string): string | null => {
  const storedData = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}api_${indicatorId}`);
  if (storedData) {
    try {
      const parsedData: StoredData = JSON.parse(storedData);
      return parsedData.lastUpdated;
    } catch (error) {
      console.error('Error parsing stored data:', error);
      return null;
    }
  }
  return null;
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