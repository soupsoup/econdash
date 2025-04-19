import { format } from 'date-fns';
import { IndicatorData, IndicatorDataPoint } from '../types';
import { economicIndicators } from '../data/indicators';
import axios from 'axios';

const LOCAL_STORAGE_PREFIX = 'presidential_dashboard_';
const FRED_API_BASE_URL = import.meta.env.PROD 
  ? '/.netlify/functions/fred-proxy'
  : '/api/fred/series/observations';

// Debug logging
console.log('Environment Configuration:', {
  isProd: import.meta.env.PROD,
  baseUrl: FRED_API_BASE_URL,
  apiKey: import.meta.env.VITE_FRED_API_KEY ? 'Present' : 'Missing',
  envKeys: Object.keys(import.meta.env)
});

export const LAST_UPDATED_KEY = `${LOCAL_STORAGE_PREFIX}last_updated`;
export const DATA_SOURCE_PREFERENCES_KEY = `${LOCAL_STORAGE_PREFIX}data_source_preferences`;

interface FredObservation {
  date: string;
  value: string;
  realtime_start?: string;
  realtime_end?: string;
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

  const url = `${FRED_API_BASE_URL}?${params.toString()}`;
  console.log('Fetching FRED data with URL:', url);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      }
    });

    console.log('FRED API Response:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries())
    });

    const contentType = response.headers.get('content-type');
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('FRED API Error Details:', {
        status: response.status,
        statusText: response.statusText,
        contentType,
        error: errorText,
        url: url
      });
      
      if (response.status === 403) {
        throw new Error('Invalid or expired FRED API key. Please check your API key configuration.');
      } else if (response.status === 404) {
        throw new Error('FRED API endpoint not found. Please check the series ID.');
      } else if (response.status === 429) {
        throw new Error('FRED API rate limit exceeded. Please try again later.');
      } else {
        throw new Error(`FRED API Error (${response.status}): ${errorText}`);
      }
    }

    if (!contentType?.includes('application/json')) {
      console.error('Invalid content type from FRED API:', contentType);
      throw new Error('Invalid response format from FRED API');
    }

    const data = await response.json();
    
    if (!data.observations || !Array.isArray(data.observations)) {
      console.error('Invalid FRED API response:', data);
      throw new Error('Invalid response from FRED API');
    }

    if (data.observations.length === 0) {
      console.error('No data returned from FRED API for series:', series);
      throw new Error(`No data available for series: ${series}`);
    }

    // Log the most recent data point
    console.log('Most recent data point for series', series, ':', data.observations[0]);

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
      // The last point doesn't have a next point to compare with
      dataPoints[dataPoints.length - 1].percentageChange = 0;
    }

    // For S&P 500, ensure we have valid values and sort by date
    if (series === 'SP500') {
      console.log('Processing S&P 500 data points:', dataPoints.slice(0, 5));  // Log first 5 points for debugging
      const validPoints = dataPoints
        .filter((point: IndicatorDataPoint) => point.value > 0)
        .sort((a: IndicatorDataPoint, b: IndicatorDataPoint) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()  // Sort in descending order (newest first)
        );
      console.log('Latest S&P 500 value:', validPoints[0]?.value);
      return validPoints;
    }

    return dataPoints;
  } catch (error) {
    console.error('Error fetching FRED data:', error);
    throw error;
  }
}

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

  const indicator = economicIndicators.find(i => i.id === indicatorId);
  if (!indicator) {
    throw new Error('Indicator not found');
  }

  try {
    console.log('Fetching FRED data for series:', indicator.seriesId);
    const data = await fetchFredData(indicator.seriesId);
    return {
      indicator,
      data,
      lastUpdated: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error fetching FRED data:', error);
    throw error;
  }
};

export const fetchAllIndicatorsData = async (): Promise<IndicatorData[]> => {
  const results: IndicatorData[] = [];
  const errors: Error[] = [];

  for (const indicator of economicIndicators) {
    try {
      console.log(`Fetching data for ${indicator.id} (${indicator.seriesId})`);
      const data = await fetchIndicatorData(indicator.id);
      results.push(data);
    } catch (error) {
      console.error(`Error fetching data for ${indicator.id}:`, error);
      errors.push(error as Error);
    }
  }

  if (results.length === 0) {
    if (errors.length > 0) {
      throw new Error(`Failed to fetch data: ${errors[0].message}`);
    }
    throw new Error('No data found. Please check your FRED API key and try again.');
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