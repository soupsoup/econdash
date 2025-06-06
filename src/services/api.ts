import { format } from 'date-fns';
import { IndicatorData, IndicatorDataPoint, EconomicIndicator } from '../types';
import { economicIndicators } from '../data/indicators';
import axios from 'axios';
import { createClient } from '@supabase/supabase-js';

// Update cache prefix to force refresh with new series IDs
const LOCAL_STORAGE_PREFIX = 'economic_indicator_v3_';
const LAST_UPDATED_PREFIX = 'last_updated_';
const LAST_UPDATED_KEY = `${LOCAL_STORAGE_PREFIX}last_global_update`;
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour in milliseconds

// Use relative URLs for both development and production
const FRED_API_BASE_URL = '/.netlify/functions/fred-proxy';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Debug logging (without sensitive info)
console.log('API Configuration:', {
  isProd: import.meta.env.PROD,
  fredApiUrl: FRED_API_BASE_URL,
  nodeEnv: process.env.NODE_ENV,
  availableIndicators: economicIndicators.map(i => i.id)
});

// Clear old cache entries
Object.keys(localStorage).forEach(key => {
  if (key.startsWith('economic_indicator_') && !key.startsWith('economic_indicator_v3_')) {
    localStorage.removeItem(key);
  }
  if (key.startsWith('last_updated_') && !key.startsWith('last_updated_v3_')) {
    localStorage.removeItem(key);
  }
});

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

  const url = `${FRED_API_BASE_URL}/series/observations?${params.toString()}`;
  console.log('Fetching FRED data:', {
    series,
    url,
    params: Object.fromEntries(params)
  });

  try {
    const response = await fetch(url);
    
    console.log('FRED API Response:', {
      series,
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers),
      ok: response.ok
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('FRED API Error:', {
        series,
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      throw new Error(`Failed to fetch data: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    
    console.log('FRED API Success:', {
      series,
      dataKeys: Object.keys(data),
      observationCount: data.observations?.length,
      sampleObservation: data.observations?.[0]
    });
    
    if (!data.observations || !Array.isArray(data.observations)) {
      console.error('Invalid FRED API response format:', {
        series,
        data
      });
      throw new Error('Invalid response format from FRED API');
    }

    // Convert observations to data points and filter out invalid values
    const dataPoints = data.observations
      .map((point: FredObservation) => ({
        date: point.date,
        value: parseFloat(point.value),
        president: '' // Will be filled by data processing logic
      }))
      .filter((point: IndicatorDataPoint) => !isNaN(point.value) && point.value !== null);

    console.log('Processed FRED data:', {
      series,
      totalObservations: data.observations.length,
      validDataPoints: dataPoints.length,
      firstPoint: dataPoints[0],
      lastPoint: dataPoints[dataPoints.length - 1]
    });

    return dataPoints;
  } catch (error) {
    console.error('Error fetching FRED data:', {
      series,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
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

export async function fetchSupabaseIndicatorData(indicatorId: string): Promise<IndicatorDataPoint[]> {
  const { data, error } = await supabase
    .from('indicator_data')
    .select('*')
    .eq('indicator_id', indicatorId)
    .order('date', { ascending: true });

  if (error) {
    console.error('Error fetching indicator data from Supabase:', error);
    return [];
  }

  return (data || []).map((d: any) => ({
    date: d.date,
    value: d.value,
    president: d.president || undefined
  }));
}

export const fetchIndicatorData = async (indicatorId: string): Promise<IndicatorData> => {
  if (indicatorId === 'umich-consumer-sentiment') {
    return {
      indicator: economicIndicators.find(i => i.id === indicatorId)!,
      data: await fetchSupabaseIndicatorData(indicatorId),
      source: 'csv'
    };
  }
  const preferences = getDataSourcePreferences();
  const useUploadedData = indicatorId === 'egg-prices' ? false : (preferences[indicatorId]?.useUploadedData || false);

  console.log(`Fetching data for indicator ${indicatorId}:`, {
    useUploadedData,
    hasStoredPreferences: !!preferences[indicatorId],
    fredApiUrl: FRED_API_BASE_URL
  });

  if (useUploadedData) {
    const uploadedData = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}uploaded_${indicatorId}`);
    if (!uploadedData) {
      console.error(`No uploaded data available for ${indicatorId}`);
      throw new Error('No uploaded data available');
    }
    return JSON.parse(uploadedData);
  }

  try {
    // Try to fetch from API
    const indicator = economicIndicators.find(i => i.id === indicatorId);
    if (!indicator) {
      console.error(`Invalid indicator ID: ${indicatorId}`);
      throw new Error('Invalid indicator ID');
    }

    // --- BLS CPI logic ---
    if (indicator.id === 'cpi') {
      // Fetch from BLS proxy
      const startyear = '2015';
      const endyear = new Date().getFullYear().toString();
      const response = await axios.post('/.netlify/functions/bls-proxy', {
        seriesid: ['CUUR0000SA0'],
        startyear,
        endyear
      });
      const blsResults = (response.data as any).Results;
      if (!blsResults || !blsResults.series || !blsResults.series[0]) {
        throw new Error('Invalid BLS API response');
      }
      const blsData = blsResults.series[0].data;
      // Sort by year and period ascending
      const sortedData = blsData.slice().sort((a: any, b: any) => {
        const dateA = new Date(`${a.year}-${a.period.substring(1).padStart(2, '0')}-01`);
        const dateB = new Date(`${b.year}-${b.period.substring(1).padStart(2, '0')}-01`);
        return dateA.getTime() - dateB.getTime();
      });
      // Calculate 12-month percent change
      const percentChangeData = sortedData.map((point: any, idx: number, arr: any[]) => {
        if (idx < 12) return null;
        const prev = arr[idx - 12];
        const pctChange = ((parseFloat(point.value) - parseFloat(prev.value)) / parseFloat(prev.value)) * 100;
        // Set date to the first of the next month
        const year = parseInt(point.year, 10);
        const month = parseInt(point.period.substring(1).padStart(2, '0'), 10);
        let nextYear = year;
        let nextMonth = month + 1;
        if (nextMonth > 12) {
          nextMonth = 1;
          nextYear += 1;
        }
        const date = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;
        return {
          date,
          value: pctChange,
          president: ''
        };
      }).filter((point: any) => point && !isNaN(point.value));
      // Debug: print last 5 dates and values
      console.log('[CPI BLS] Last 5 percentChangeData:', percentChangeData.slice(-5).map((p: any) => ({date: p.date, value: p.value})));
      const indicatorData: IndicatorData = { indicator, data: percentChangeData, source: 'api' };
      // Store API data locally with timestamp
      const storedData: StoredData = {
        data: indicatorData,
        lastUpdated: new Date().toISOString()
      };
      localStorage.setItem(`${LOCAL_STORAGE_PREFIX}api_${indicatorId}`, JSON.stringify(storedData));
      localStorage.setItem(`${LAST_UPDATED_PREFIX}${indicatorId}`, new Date().toISOString());
      return indicatorData;
    }
    // --- End BLS CPI logic ---

    // --- BEA GDP logic ---
    if (indicator.id === 'gdp-growth') {
      // Fetch from BEA proxy
      const response = await axios.get('/.netlify/functions/bea-gdp');
      const beaData = (response.data as any)?.data || [];
      if (!Array.isArray(beaData) || beaData.length === 0) {
        throw new Error('No data returned from BEA GDP function');
      }
      // Map to IndicatorDataPoint[]
      const dataPoints = beaData.map((d: any) => ({
        date: d.date,
        value: d.value,
        president: ''
      }));
      const indicatorData: IndicatorData = { indicator, data: dataPoints, source: 'api' };
      // Store API data locally with timestamp
      const storedData: StoredData = {
        data: indicatorData,
        lastUpdated: new Date().toISOString()
      };
      localStorage.setItem(`${LOCAL_STORAGE_PREFIX}api_${indicatorId}`, JSON.stringify(storedData));
      localStorage.setItem(`${LAST_UPDATED_PREFIX}${indicatorId}`, new Date().toISOString());
      return indicatorData;
    }
    // --- End BEA GDP logic ---

    // FRED logic for other indicators
    const today = new Date().toISOString().split('T')[0];
    const params = new URLSearchParams({
      series_id: indicator.seriesId,
      observation_start: '1950-01-01',
      observation_end: today,
      sort_order: 'desc',
      units: 'lin',
      file_type: 'json'
    });

    // Log the request details
    const requestUrl = `${FRED_API_BASE_URL}`;
    console.log(`Making FRED API request for ${indicator.name}:`, {
      indicatorId,
      seriesId: indicator.seriesId,
      params: Object.fromEntries(params.entries()),
      requestUrl,
      fullUrl: `${requestUrl}?${params.toString()}`
    });

    // Add retry logic for the request
    let response;
    let retries = 3;
    let lastError;

    while (retries > 0) {
      try {
        response = await axios.get<FredResponse>(requestUrl, {
          params,
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          timeout: 10000,
          validateStatus: (status) => status === 200
        });
        break;
      } catch (error) {
        lastError = error;
        console.error(`Attempt ${4 - retries} failed for ${indicator.name}:`, error);
        retries--;
        if (retries > 0) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (4 - retries)));
          continue;
        }
        throw error;
      }
    }

    if (!response?.data) {
      console.error(`Empty response for ${indicator.name}`);
      throw new Error('Empty API response');
    }

    console.log(`API Response for ${indicator.name}:`, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      dataSize: JSON.stringify(response.data).length,
      observationCount: response.data.observations?.length,
      sampleData: response.data.observations?.[0]
    });

    if (!response.data.observations || !Array.isArray(response.data.observations)) {
      console.error('Invalid API response:', response.data);
      throw new Error('Invalid API response format');
    }

    let formattedData = formatFredData(response.data.observations, indicator);

    // --- CPI-specific logic: calculate 12-month percent change from index values ---
    if (indicator.id === 'cpi') {
      // Sort by date ascending
      formattedData = formattedData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      const percentChangeData = formattedData.map((point, idx, arr) => {
        if (idx < 12) {
          return { ...point, value: NaN };
        }
        const prev = arr[idx - 12];
        const pctChange = ((point.value - prev.value) / prev.value) * 100;
        // Set date to the first of the next month
        const d = new Date(point.date);
        d.setMonth(d.getMonth() + 1);
        const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
        return { ...point, date, value: pctChange };
      }).filter(point => !isNaN(point.value));
      // Debug: print last 5 dates and values
      console.log('[CPI FRED/CSV] Last 5 percentChangeData:', percentChangeData.slice(-5).map((p: any) => ({date: p.date, value: p.value})));
      formattedData = percentChangeData;
    }
    // --- End CPI-specific logic ---

    if (formattedData.length === 0) {
      console.error(`No valid data points for ${indicator.name}`);
      throw new Error('No valid data points');
    }

    const indicatorData: IndicatorData = { indicator, data: formattedData, source: 'api' };

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
      console.log(`Using locally stored API data from ${parsedData.lastUpdated} for ${indicatorId}`);
      return parsedData.data;
    }
    // Try to use uploaded CSV fallback if available
    const uploadedData = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}uploaded_${indicatorId}`);
    if (uploadedData) {
      console.log(`Using uploaded CSV fallback for ${indicatorId}`);
      const parsed = JSON.parse(uploadedData);
      const indicator = economicIndicators.find(i => i.id === indicatorId);
      if (indicatorId === 'cpi' && parsed.data && parsed.data.length > 0) {
        // Check if values are likely index values (e.g., > 20)
        const isIndex = parsed.data.some((point: any) => point.value > 20);
        let processedData = parsed.data;
        if (isIndex) {
          // Sort by date ascending
          processedData = processedData.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
          processedData = processedData.map((point: any, idx: number, arr: any[]) => {
            if (idx < 12) {
              return { ...point, value: NaN };
            }
            const prev = arr[idx - 12];
            const pctChange = ((point.value - prev.value) / prev.value) * 100;
            // Set date to the first of the next month
            const d = new Date(point.date);
            d.setMonth(d.getMonth() + 1);
            const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
            return { ...point, date, value: pctChange };
          }).filter((point: any) => !isNaN(point.value));
          // Debug: print last 5 dates and values
          console.log('[CPI CSV Fallback] Last 5 percentChangeData:', processedData.slice(-5).map((p: any) => ({date: p.date, value: p.value})));
        }
        return { indicator, data: processedData, source: 'api' } as IndicatorData;
      }
      return { indicator, data: parsed.data, source: 'api' } as IndicatorData;
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
    
    // If it's been more than 1 hour since last update, trigger a refresh
    if (now - lastUpdateTime > CACHE_DURATION) {
      return true;
    }

    // Also check individual indicator timestamps
    const anyIndicatorNeedsUpdate = economicIndicators.some(indicator => {
      const indicatorLastUpdate = localStorage.getItem(`${LAST_UPDATED_PREFIX}${indicator.id}`);
      if (!indicatorLastUpdate) return true;
      return (now - new Date(indicatorLastUpdate).getTime()) > CACHE_DURATION;
    });

    return anyIndicatorNeedsUpdate;
  } catch (error) {
    console.error('Error checking for updates:', error);
    return true;
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
    // Clear all versions of cached data
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('economic_indicator_') || 
          key.startsWith('last_updated_') ||
          key.includes('uploaded_')) {
        localStorage.removeItem(key);
      }
    });
    console.log('All stored data cleared successfully');
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