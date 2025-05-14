import { format } from 'date-fns';
import { IndicatorData, IndicatorDataPoint, EconomicIndicator } from '../types';
import { economicIndicators } from '../data/indicators';
import axios from 'axios';

// Update cache prefix to force refresh with new series IDs
const LOCAL_STORAGE_PREFIX = 'economic_indicator_v3_';
const LAST_UPDATED_PREFIX = 'last_updated_';
const LAST_UPDATED_KEY = `${LOCAL_STORAGE_PREFIX}last_global_update`;
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour in milliseconds

// Use relative URLs for both development and production
const FRED_API_BASE_URL = '/.netlify/functions/fred-proxy';
const BLS_API_BASE_URL = '/.netlify/functions/bls-proxy';

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

interface BlsObservation {
  year: string;
  period: string;
  periodName: string;
  value: string;
  footnotes: Array<{ code: string; text: string }>;
}

interface BlsResponse {
  status: string;
  responseTime: number;
  message: string[];
  Results: {
    series: Array<{
      seriesID: string;
      data: BlsObservation[];
    }>;
  };
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

// Add a new type for the return value
export interface BlsDataWithCache {
  data: IndicatorDataPoint[];
  cachedAt?: string; // ISO string if using cached data
  csvFallback?: boolean;
  supabaseFallback?: boolean;
}

async function fetchBlsData(series: string): Promise<IndicatorDataPoint[] | BlsDataWithCache> {
  const today = new Date();
  const startYear = '1913'; // CPI data starts from 1913
  const endYear = today.getFullYear();

  const params = new URLSearchParams({
    seriesid: series,
    startyear: startYear,
    endyear: endYear.toString(),
    registrationkey: import.meta.env.VITE_BLS_API_KEY || '',
    calculations: 'false', // We want the raw index
    annualaverage: 'false'
  });

  const url = `${BLS_API_BASE_URL}?${params.toString()}`;
  console.log('Fetching BLS data:', {
    series,
    url,
    params: Object.fromEntries(params)
  });

  try {
    const response = await fetch(url);
    if (!response.ok) {
      const errorText = await response.text();
      console.error('BLS API Error:', {
        series,
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      // Check for rate limit error
      if (errorText.includes('daily threshold') || errorText.includes('REQUEST_NOT_PROCESSED')) {
        // Try to get cached data
        const cachedData = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}api_${series}`);
        if (cachedData) {
          console.log('Using cached BLS data due to rate limit');
          const parsedData = JSON.parse(cachedData);
          return { data: parsedData.data, cachedAt: new Date(parsedData.timestamp).toISOString() };
        }
        // Try to get CSV fallback for CPI
        if (series === 'CUUR0000SA0') {
          const csvFallback = localStorage.getItem('economic_indicator_v3_api_cpi');
          if (csvFallback) {
            console.log('Using CSV fallback CPI data due to BLS rate limit and no API cache');
            const parsed = JSON.parse(csvFallback);
            return { data: parsed.data, cachedAt: new Date(parsed.timestamp).toISOString(), csvFallback: true };
          }
        }
        throw new Error('BLS API rate limit reached. Please try again later or contact support if this persists.');
      }
      throw new Error(`Failed to fetch BLS data: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data: BlsResponse = await response.json();
    // Check for rate limit in the response data
    if (data.status === 'REQUEST_NOT_PROCESSED' && 
        data.message?.some(msg => msg.includes('daily threshold'))) {
      // Try to get cached data
      const cachedData = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}api_${series}`);
      if (cachedData) {
        console.log('Using cached BLS data due to rate limit');
        const parsedData = JSON.parse(cachedData);
        return { data: parsedData.data, cachedAt: new Date(parsedData.timestamp).toISOString() };
      }
      // Try to get CSV fallback for CPI
      if (series === 'CUUR0000SA0') {
        const csvFallback = localStorage.getItem('economic_indicator_v3_api_cpi');
        if (csvFallback) {
          console.log('Using CSV fallback CPI data due to BLS rate limit and no API cache');
          const parsed = JSON.parse(csvFallback);
          return { data: parsed.data, cachedAt: new Date(parsed.timestamp).toISOString(), csvFallback: true };
        }
      }
      throw new Error('BLS API rate limit reached. Please try again later or contact support if this persists.');
    }
    // Fallback to Supabase if BLS API response is invalid
    if (!data.Results?.series?.[0]?.data) {
      if (series === 'CUUR0000SA0') {
        try {
          const resp = await fetch('/.netlify/functions/indicator-db?indicator_id=cpi');
          if (resp.ok) {
            const dbData = await resp.json();
            if (Array.isArray(dbData) && dbData.length > 0) {
              return {
                data: dbData.map((row: any) => ({ date: row.date, value: parseFloat(row.value) })),
                cachedAt: dbData[dbData.length - 1]?.date,
                supabaseFallback: true
              };
            }
          }
        } catch (dbError) {
          console.error('Supabase fallback failed:', dbError);
        }
      }
      throw new Error('Invalid response format from BLS API');
    }
    // Only keep valid monthly periods (M01-M12)
    const monthly = data.Results.series[0].data
      .filter(point => /^M(0[1-9]|1[0-2])$/.test(point.period))
      .map(point => ({
        date: `${point.year}-${point.period.replace('M', '').padStart(2, '0')}-01`,
        value: parseFloat(point.value)
      }))
      .filter(point => !isNaN(point.value) && point.value !== null)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    // Cache the successful response
    localStorage.setItem(`${LOCAL_STORAGE_PREFIX}api_${series}`, JSON.stringify({
      data: monthly,
      timestamp: Date.now()
    }));
    return monthly;
  } catch (error) {
    console.error('Error fetching BLS data:', {
      series,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    // Try to get Supabase fallback for CPI on any error
    if (series === 'CUUR0000SA0') {
      try {
        const resp = await fetch('/.netlify/functions/indicator-db?indicator_id=cpi');
        if (resp.ok) {
          const dbData = await resp.json();
          if (Array.isArray(dbData) && dbData.length > 0) {
            return {
              data: dbData.map((row: any) => ({ date: row.date, value: parseFloat(row.value) })),
              cachedAt: dbData[dbData.length - 1]?.date,
              supabaseFallback: true
            };
          }
        }
      } catch (dbError) {
        console.error('Supabase fallback failed:', dbError);
      }
    }

    // Try to get CSV fallback for CPI on any error
    if (series === 'CUUR0000SA0') {
      const csvFallback = localStorage.getItem('economic_indicator_v3_api_cpi');
      if (csvFallback) {
        console.log('Using CSV fallback CPI data due to BLS API error');
        const parsed = JSON.parse(csvFallback);
        return { data: parsed.data, cachedAt: new Date(parsed.timestamp).toISOString(), csvFallback: true };
      }
    }

    throw error;
  }
}

async function testBlsApiKey(): Promise<boolean> {
  const apiKey = import.meta.env.VITE_BLS_API_KEY;
  if (!apiKey) {
    console.error('BLS API key is missing in environment variables');
    return false;
  }

  try {
    const testUrl = `${BLS_API_BASE_URL}?seriesid=CUUR0000SA0&startyear=2024&endyear=2024&registrationkey=${apiKey}`;
    console.log('Testing BLS API with URL:', testUrl);
    
    const response = await fetch(testUrl);
    
    console.log('BLS API Test Response:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries())
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('BLS API Test Error:', errorText);
      return false;
    }

    const data = await response.json();
    console.log('BLS API Test Success:', data);
    return true;
  } catch (error) {
    console.error('BLS API Test Error:', error);
    return false;
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
  // Cleanup: Always remove uploaded CPI data and preference
  if (indicatorId === 'cpi') {
    localStorage.removeItem('economic_indicator_v3_uploaded_cpi');
    const prefsKey = 'economic_indicator_v3_data_source_preferences';
    const prefs = JSON.parse(localStorage.getItem(prefsKey) || '{}');
    if (prefs.cpi) {
      delete prefs.cpi;
      localStorage.setItem(prefsKey, JSON.stringify(prefs));
    }
  }

  const preferences = getDataSourcePreferences();
  // For CPI, never use uploaded data
  const useUploadedData = indicatorId !== 'cpi' && preferences[indicatorId]?.useUploadedData;

  console.log(`Fetching data for indicator ${indicatorId}:`, {
    useUploadedData,
    hasStoredPreferences: !!preferences[indicatorId]
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
    const indicator = economicIndicators.find(i => i.id === indicatorId);
    if (!indicator) {
      console.error(`Invalid indicator ID: ${indicatorId}`);
      throw new Error('Invalid indicator ID');
    }

    let dataPoints: IndicatorDataPoint[];
    let blsCachedAt: string | undefined = undefined;

    if (indicator.source === 'BLS') {
      if (indicator.id === 'ppi') {
        // Fetch BLS data and use the 12-month percent change directly
        const today = new Date();
        const startYear = '2015'; // reasonable default for PPI
        const endYear = today.getFullYear();
        const params = new URLSearchParams({
          seriesid: indicator.seriesId,
          startyear: startYear,
          endyear: endYear.toString(),
          registrationkey: import.meta.env.VITE_BLS_API_KEY || '',
          calculations: 'true',
          annualaverage: 'false'
        });
        const url = `${BLS_API_BASE_URL}?${params.toString()}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch BLS PPI data');
        const data = await response.json();
        const raw = data.Results?.series?.[0]?.data || [];
        dataPoints = raw
          .filter((point: any) => /^M(0[1-9]|1[0-2])$/.test(point.period))
          .map((point: any) => {
            let year = parseInt(point.year, 10);
            let month = parseInt(point.period.replace('M', ''), 10) + 1;
            if (month > 12) {
              month = 1;
              year += 1;
            }
            return {
              date: `${year}-${month.toString().padStart(2, '0')}-01`,
              value: point.calculations?.pct_changes?.['12'] ? parseFloat(point.calculations.pct_changes['12']) : null
            };
          })
          .filter((point: any) => point.value !== null && !isNaN(point.value))
          .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
      } else if (indicator.id === 'cpi') {
        const blsResult = await fetchBlsData(indicator.seriesId);
        if (Array.isArray(blsResult)) {
          dataPoints = blsResult;
        } else {
          dataPoints = blsResult.data;
          blsCachedAt = blsResult.cachedAt;
        }
        // Sort by date ascending (should already be sorted)
        const yoyPoints: IndicatorDataPoint[] = [];
        for (let i = 12; i < dataPoints.length; i++) {
          const prev = dataPoints[i - 12];
          const curr = dataPoints[i];
          if (prev && curr && prev.value !== 0) {
            const pctChange = ((curr.value - prev.value) / prev.value) * 100;
            yoyPoints.push({ date: curr.date, value: parseFloat(pctChange.toFixed(1)) });
          }
        }
        dataPoints = yoyPoints;
      } else {
        const blsResult = await fetchBlsData(indicator.seriesId);
        if (Array.isArray(blsResult)) {
          dataPoints = blsResult;
        } else {
          dataPoints = blsResult.data;
          blsCachedAt = blsResult.cachedAt;
        }
      }
    } else if (indicator.source === 'MetalPriceAPI') {
      // Fetch gold price history from MetalPriceAPI (assume you have a Netlify function or direct API call)
      // For this example, we'll use a Netlify function endpoint: /.netlify/functions/metal-gold-history
      // The endpoint should return an array of { date: 'YYYY-MM-DD', value: number }
      const response = await fetch('/.netlify/functions/metal-gold-history');
      if (!response.ok) {
        throw new Error('Failed to fetch gold price data');
      }
      const goldData = await response.json();
      dataPoints = goldData.map((point: any) => ({
        date: point.date,
        value: point.value
      }));
    } else if (indicator.source === 'Census') {
      // Fetch US Retail Sales from Netlify function proxy
      const response = await fetch('/.netlify/functions/census-retail-sales');
      if (!response.ok) throw new Error('Failed to fetch Census Retail Sales data');
      dataPoints = await response.json();
    } else {
      dataPoints = await fetchFredData(indicator.seriesId);
    }

    if (dataPoints.length === 0) {
      console.error(`No valid data points for ${indicator.name}`);
      throw new Error('No valid data points');
    }

    // Optionally include blsCachedAt in the returned object for downstream use
    const indicatorData: IndicatorData & { blsCachedAt?: string } = { indicator, data: dataPoints };
    if (blsCachedAt) {
      indicatorData.blsCachedAt = blsCachedAt;
    }

    // Store API data locally with timestamp
    const storedData: StoredData = {
      data: indicatorData,
      lastUpdated: new Date().toISOString()
    };

    localStorage.setItem(`${LOCAL_STORAGE_PREFIX}api_${indicatorId}`, JSON.stringify(storedData));
    localStorage.setItem(`${LAST_UPDATED_PREFIX}${indicatorId}`, new Date().toISOString());

    return indicatorData;
  } catch (error) {
    console.error(`Error fetching data for ${indicatorId}:`, error);
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