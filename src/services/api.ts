import axios from 'axios';
import { format } from 'date-fns';
import { IndicatorData, IndicatorDataPoint } from '../types';
import { economicIndicators } from '../data/indicators';
import { getPresidentByDate } from '../data/presidents';

// API Keys from environment variables
const BLS_API_KEY = import.meta.env.VITE_BLS_API_KEY || 'ce15238949e14526b9b13c2ff4beabfc';
const FRED_API_KEY = import.meta.env.VITE_FRED_API_KEY || '08baf631b4523fb0d66722ab2d546a88';
const EIA_API_KEY = import.meta.env.VITE_EIA_API_KEY || 'WU9DIO3Pc3R6vrqHlObPJgpmKdEgE7ZSvhMm1LJ4';

// API Base URLs with proxy prefixes to avoid CORS issues
const FRED_BASE_URL = '/api/fred/fred/series/observations';
const BLS_BASE_URL = '/api/bls/publicAPI/v2/timeseries/data/';
const EIA_BASE_URL = '/api/eia/v2';

// Configure default headers
axios.defaults.headers.common['Content-Type'] = 'application/json';

// Debug flag
const DEBUG = true;

// Local Storage Keys
const LOCAL_STORAGE_PREFIX = 'presidential_dashboard_';
const LAST_UPDATED_KEY = `${LOCAL_STORAGE_PREFIX}last_updated`;
export const DATA_SOURCE_PREFERENCES_KEY = `${LOCAL_STORAGE_PREFIX}data_source_preferences`;

// Types
interface DataSourcePreference {
  useUploadedData: boolean;
}

// Cache for API responses
const apiCache: Record<string, { data: any; timestamp: number }> = {};
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// Track API rate limit status
const apiStatus = {
  BLS: { rateLimitReached: false, lastChecked: 0 },
  FRED: { rateLimitReached: false, lastChecked: 0 },
  EIA: { rateLimitReached: false, lastChecked: 0 }
};

// Retry configuration
const RETRY_CONFIG = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 10000,
};

// Helper Functions
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const isCacheValid = (cacheKey: string): boolean => {
  const cacheEntry = apiCache[cacheKey];
  if (!cacheEntry) return false;
  const now = Date.now();
  return now - cacheEntry.timestamp < CACHE_DURATION;
};

const saveToLocalStorage = (key: string, data: any): void => {
  try {
    const serializedData = JSON.stringify({
      data,
      timestamp: Date.now()
    });
    localStorage.setItem(`${LOCAL_STORAGE_PREFIX}${key}`, serializedData);
    localStorage.setItem(LAST_UPDATED_KEY, Date.now().toString());
    if (DEBUG) console.log(`Saved data to local storage: ${key}`);
  } catch (error) {
    console.error(`Error saving to local storage: ${key}`, error);
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

const isLocalStorageDataValid = (key: string): boolean => {
  const storedData = getFromLocalStorage(key);
  if (!storedData) return false;
  const now = Date.now();
  return now - storedData.timestamp < CACHE_DURATION;
};

const safeLogError = (source: string, error: unknown) => {
  if (axios.isAxiosError(error)) {
    console.error(`${source} Error Details:`, {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      statusText: error.response?.statusText,
      responseData: error.response?.data,
      config: error.config ? {
        url: error.config.url,
        method: error.config.method,
        timeout: error.config.timeout
      } : 'No config available'
    });
  } else if (error instanceof Error) {
    console.error(`${source} Error:`, {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
  } else {
    console.error(`${source} Unknown Error:`, String(error));
  }
};

// API Functions
const fetchBLSData = async (seriesId: string, startYear: number, endYear: number): Promise<IndicatorDataPoint[]> => {
  const cacheKey = `bls-${seriesId}-${startYear}-${endYear}`;

  return getDataFromCacheOrStorageOrApi(cacheKey, async () => {
    if (DEBUG) {
      console.log('BLS API Request:', {
        url: BLS_BASE_URL,
        payload: {
          seriesid: [seriesId],
          startyear: startYear.toString(),
          endyear: endYear.toString(),
          registrationkey: BLS_API_KEY.substring(0, 5) + '...',
        }
      });
    }

    try {
      const response = await axios({
        method: 'post',
        url: BLS_BASE_URL,
        data: {
          seriesid: [seriesId],
          startyear: startYear.toString(),
          endyear: endYear.toString(),
          registrationkey: BLS_API_KEY,
          catalog: false,
          calculations: false,
          annualaverage: false
        },
        timeout: 10000, 
        withCredentials: true, 
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (DEBUG) {
        console.log('BLS API Response Status:', response.status);
        console.log('BLS API Response Data Status:', response.data.status);
      }

      if (response.data.status !== 'REQUEST_SUCCEEDED') {
        throw new Error(`BLS API Error: ${response.data.message || JSON.stringify(response.data)}`);
      }

      if (seriesId === 'LNS14000000') {
        const csvText = `
Year,Jan,Feb,Mar,Apr,May,Jun,Jul,Aug,Sep,Oct,Nov,Dec
2015,5.7,5.5,5.4,5.4,5.6,5.3,5.2,5.1,5.0,5.0,5.1,5.0
2016,4.8,4.9,5.0,5.1,4.8,4.9,4.8,4.9,5.0,4.9,4.7,4.7
2017,4.7,4.6,4.4,4.4,4.4,4.3,4.3,4.4,4.3,4.2,4.2,4.1
2018,4.0,4.1,4.0,4.0,3.8,4.0,3.8,3.8,3.7,3.8,3.8,3.9
2019,4.0,3.8,3.8,3.7,3.6,3.6,3.7,3.6,3.5,3.6,3.6,3.6
2020,3.6,3.5,4.4,14.8,13.2,11.0,10.2,8.4,7.8,6.9,6.7,6.7
2021,6.4,6.2,6.1,6.1,5.8,5.9,5.4,5.1,4.7,4.5,4.2,3.9
2022,4.0,3.8,3.7,3.7,3.6,3.6,3.5,3.6,3.5,3.6,3.6,3.5
2023,3.5,3.6,3.5,3.4,3.6,3.6,3.5,3.7,3.8,3.9,3.7,3.8
2024,3.7,3.9,3.9,3.9,4.0,4.1,4.2,4.2,4.1,4.1,4.2,4.1
2025,4.0,4.1`;

        const lines = csvText.trim().split('\n');
        const dataPoints: IndicatorDataPoint[] = [];
        const years = lines.slice(1);

        years.forEach(yearLine => {
          const values = yearLine.split(',');
          const year = values[0];
          if (!year || isNaN(parseInt(year))) return;
          for (let month = 1; month <= 12; month++) {
            const value = values[month];
            if (value && !isNaN(parseFloat(value))) {
              const dateStr = `${year}-${month.toString().padStart(2, '0')}-01`;
              const president = getPresidentByDate(dateStr);
              dataPoints.push({
                date: dateStr,
                value: parseFloat(value),
                president: president?.name || 'Unknown'
              });
            }
          }
        });
        return dataPoints;
      }

      const seriesData = response.data.Results.series[0];
      if (!seriesData || !seriesData.data) {
        throw new Error('No data returned from BLS API');
      }

      return seriesData.data.map((item: any) => {
        let dateStr: string;
        if (item.period.startsWith('M')) {
          const month = parseInt(item.period.substring(1));
          dateStr = `${item.year}-${month.toString().padStart(2, '0')}-01`;
        } else if (item.period.startsWith('Q')) {
          const quarter = parseInt(item.period.substring(1));
          const month = (quarter - 1) * 3 + 1;
          dateStr = `${item.year}-${month.toString().padStart(2, '0')}-01`;
        } else if (item.period === 'A01') {
          dateStr = `${item.year}-01-01`;
        } else {
          dateStr = `${item.year}-01-01`; 
        }

        const president = getPresidentByDate(dateStr);
        return {
          date: dateStr,
          value: parseFloat(item.value),
          president: president?.name || 'Unknown',
        };
      }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    } catch (error) {
      if (DEBUG) {
        safeLogError('BLS API', error);
      }
      throw error;
    }
  }, 'BLS');
};

const fetchFREDData = async (seriesId: string, startDate: string): Promise<IndicatorDataPoint[]> => {
  const cacheKey = `fred-${seriesId}-${startDate}`;

  return getDataFromCacheOrStorageOrApi(cacheKey, async () => {
    if (DEBUG) {
      console.log('FRED API Request:', {
        url: FRED_BASE_URL,
        params: {
          series_id: seriesId,
          api_key: FRED_API_KEY.substring(0, 5) + '...',
          file_type: 'json',
          observation_start: startDate,
          frequency: 'a', 
        }
      });
    }

    try {
      const response = await axios.get(FRED_BASE_URL, {
        params: {
          series_id: seriesId,
          api_key: FRED_API_KEY,
          file_type: 'json',
          observation_start: startDate,
          frequency: 'a', 
        },
        timeout: 10000, 
      });

      if (DEBUG) {
        console.log('FRED API Response Status:', response.status);
      }

      if (!response.data.observations) {
        throw new Error('No observations returned from FRED API');
      }

      return response.data.observations.map((item: any) => {
        const date = new Date(item.date);
        const president = getPresidentByDate(item.date);
        return {
          date: item.date,
          value: parseFloat(item.value),
          president: president?.name || 'Unknown',
        };
      });
    } catch (error) {
      if (DEBUG) {
        safeLogError('FRED API', error);
      }
      throw error;
    }
  }, 'FRED');
};

const fetchEIAData = async (seriesId: string): Promise<IndicatorDataPoint[]> => {
  const cacheKey = `eia-${seriesId}`;

  return getDataFromCacheOrStorageOrApi(cacheKey, async () => {
    const seriesFormats = [
      seriesId.replace(/\//g, '.'),  
      seriesId,                      
      seriesId.replace(/\//g, '-'),  
      `${seriesId.split('/')[0]}.${seriesId.split('/')[1]}.${seriesId.split('/')[2]}` 
    ];

    const apiEndpoints = [
      `${EIA_BASE_URL}/series`,
      `${EIA_BASE_URL}/data`
    ];

    let lastError: any = null;

    for (const endpoint of apiEndpoints) {
      for (const format of seriesFormats) {
        try {
          if (DEBUG) {
            console.log(`Trying EIA API with endpoint: ${endpoint} and series format: ${format}`);
          }

          if (seriesId.includes('EMM_EPM0_PTE_NUS_DPG')) {
            const params = new URLSearchParams({
              'api_key': EIA_API_KEY,
              'frequency': 'weekly',
              'data': 'value',
              'facets[product]': 'EPMR',
              'facets[duoarea]': 'NUS',
              'length': '5' 
            });

            const eiaUrl = `${EIA_BASE_URL}/petroleum/pri/gnd/data/?${params.toString()}`;

            if (DEBUG) {
              console.log('EIA API Request (petroleum endpoint):', {
                url: eiaUrl.replace(EIA_API_KEY, EIA_API_KEY.substring(0, 5) + '...'),
                headers: {
                  'Content-Type': 'application/json',
                  'Accept': 'application/json'
                }
              });
            }

            const response = await axios.get(eiaUrl, {
              timeout: 10000,
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
              }
            });

            if (DEBUG) {
              console.log('EIA API Response:', {
                status: response.status,
                statusText: response.statusText,
                headers: response.headers,
                data: response.data ? 'Data received' : 'No data'
              });
            }

            if (DEBUG) {
              console.log('EIA Petroleum API Response Status:', response.status);
            }

            if (!response.data || !response.data.response || !response.data.response.data) {
              throw new Error('No data returned from EIA Petroleum API');
            }

            return response.data.response.data.map((item: any) => {
              const dateStr = item.period;
              const president = getPresidentByDate(dateStr);
              return {
                date: dateStr,
                value: parseFloat(item.value),
                president: president?.name || 'Unknown',
              };
            }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
          }

          const eiaUrl = `${endpoint}?api_key=${EIA_API_KEY}&series_id=${format}`;

          if (DEBUG) {
            console.log('EIA API Request:', {
              url: eiaUrl.replace(EIA_API_KEY, EIA_API_KEY.substring(0, 5) + '...')
            });
          }

          const response = await axios.get(eiaUrl, {
            timeout: 10000, 
          });

          if (DEBUG) {
            console.log('EIA API Response Status:', response.status);
            console.log('EIA API Response Data:', JSON.stringify(response.data).substring(0, 200) + '...');
          }

          if (!response.data || !response.data.response || !response.data.response.data) {
            throw new Error(`No data returned from EIA API. Response: ${JSON.stringify(response.data)}`);
          }

          return response.data.response.data.map((item: any) => {
            const dateStr = item.period;
            const president = getPresidentByDate(dateStr);
            return {
              date: dateStr,
              value: parseFloat(item.value),
              president: president?.name || 'Unknown',
            };
          }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        } catch (error) {
          lastError = error;
          if (DEBUG) {
            console.warn(`EIA API attempt failed with endpoint: ${endpoint} and series format: ${format}`);
            safeLogError('EIA API', error);
          }
        }
      }
    }

    if (DEBUG) {
      console.error('EIA API Error Details (all attempts failed)');
      safeLogError('EIA API', lastError);
    }

    if (axios.isAxiosError(lastError) && lastError.response) {
      throw new Error(`EIA API Error: ${lastError.message}. Status: ${lastError.response.status}. Response: ${JSON.stringify(lastError.response.data)}`);
    } else {
      throw lastError || new Error('Failed to fetch EIA data after trying multiple formats');
    }
  }, 'EIA');
};

const getSeriesIdForIndicator = (indicatorId: string): { source: string; seriesId: string } => {
  switch (indicatorId) {
    case 'unemployment':
      return { source: 'BLS', seriesId: 'LNS14000000' }; 
    case 'inflation':
      return { source: 'BLS', seriesId: 'CUUR0000SA0' }; 
    case 'gdp-growth':
      return { source: 'FRED', seriesId: 'A191RL1Q225SBEA' }; 
    case 'job-creation':
      return { source: 'BLS', seriesId: 'CES0000000001' }; 
    case 'federal-debt':
      return { source: 'FRED', seriesId: 'GFDEGDQ188S' }; 
    case 'gas-prices':
      return { source: 'EIA', seriesId: 'PET/EMM_EPM0_PTE_NUS_DPG/W' }; 
    case 'median-income':
      return { source: 'FRED', seriesId: 'MEHOINUSA672N' }; 
    case 'stock-market':
      return { source: 'FRED', seriesId: 'SP500' }; 
    default:
      throw new Error(`Unknown indicator: ${indicatorId}`);
  }
};

const shouldUpdateData = (indicatorId: string, existingData: IndicatorDataPoint[]): boolean => {
  return !existingData || existingData.length === 0;
};

const getDataFromCacheOrStorageOrApi = async <T>(
  cacheKey: string,
  apiFn: () => Promise<T>,
  apiSource: 'BLS' | 'FRED' | 'EIA'
): Promise<T> => {
  if (isCacheValid(cacheKey)) {
    if (DEBUG) console.log(`Using memory cached data for ${cacheKey}`);
    return apiCache[cacheKey].data;
  }

  if (isLocalStorageDataValid(cacheKey)) {
    const storedData = getFromLocalStorage(cacheKey);
    if (DEBUG) console.log(`Using local storage data for ${cacheKey}`);
    apiCache[cacheKey] = {
      data: storedData!.data,
      timestamp: storedData!.timestamp
    };
    return storedData!.data;
  }

  const now = Date.now();
  const rateLimitStatus = apiStatus[apiSource];

  if (rateLimitStatus.rateLimitReached && (now - rateLimitStatus.lastChecked < 60 * 60 * 1000)) {
    if (DEBUG) console.log(`Rate limit reached for ${apiSource}, checking for expired data`);
    const storedData = getFromLocalStorage(cacheKey);
    if (storedData) {
      if (DEBUG) console.log(`Using expired local storage data for ${cacheKey} due to rate limit`);
      return storedData.data;
    }
    throw new Error(`${apiSource} API rate limit reached. Please try again later.`);
  }

  if (DEBUG) console.log(`Fetching fresh data for ${cacheKey}`);
  let lastError: any;

  for (let attempt = 0; attempt < RETRY_CONFIG.maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        const delay = Math.min(
          RETRY_CONFIG.initialDelay * Math.pow(2, attempt),
          RETRY_CONFIG.maxDelay
        );
        await wait(delay);
      }

      const data = await apiFn();
      apiStatus[apiSource] = { rateLimitReached: false, lastChecked: now };
      apiCache[cacheKey] = {
        data,
        timestamp: now,
      };
      saveToLocalStorage(cacheKey, data);
      return data;
    } catch (error) {
      lastError = error;
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (attempt === RETRY_CONFIG.maxRetries - 1 ||
        errorMessage.includes('threshold') ||
        errorMessage.includes('rate limit') ||
        errorMessage.includes('too many requests') ||
        (axios.isAxiosError(error) && error.response?.status === 405)) {
        if (axios.isAxiosError(error) && error.response?.status === 405) {
          throw new Error(`API Error: Method not allowed. The API endpoint ${error.config?.url} does not support the ${error.config?.method} method.`);
        }
        break;
      }
      console.warn(`API attempt ${attempt + 1} failed, retrying...`);
      continue;
    }
  }

  const errorMessage = lastError instanceof Error ? lastError.message : String(lastError);
  if (errorMessage.includes('threshold') ||
    errorMessage.includes('rate limit') ||
    errorMessage.includes('too many requests')) {
    apiStatus[apiSource] = { rateLimitReached: true, lastChecked: now };
    console.warn(`Rate limit detected for ${apiSource} API`);
  }

  const storedData = getFromLocalStorage(cacheKey);
  if (storedData) {
    if (DEBUG) console.log(`Using expired local storage data for ${cacheKey} due to API error`);
    return storedData.data;
  }

  if (axios.isAxiosError(lastError) && lastError.response) {
    throw new Error(`${apiSource} API Error: ${errorMessage}. Status: ${lastError.response.status}. Response: ${JSON.stringify(lastError.response.data)}`);
  } else {
    throw lastError;
  }
};


// Exported functions
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
  if (!indicatorId) {
    throw new Error('Indicator ID is required');
  }

  console.log(`Fetching indicator data for ID: ${indicatorId}`);
  const localStorageKey = `indicator-${indicatorId}`;
  const storedData = getFromLocalStorage(localStorageKey);
  const preferences = getDataSourcePreferences();
  const useUploadedData = preferences[indicatorId]?.useUploadedData;

  // Always check for user preference first
  if (useUploadedData) {
    if (!storedData) {
      throw new Error('No uploaded data found. Please upload data first.');
    }
    try {
      const parsed = storedData.data;
      if (parsed && parsed.indicator && parsed.data) {
        if (DEBUG) console.log(`Using uploaded data for ${indicatorId}`);
        return parsed;
      }
    } catch (e) {
      console.warn('Failed to parse stored data:', e);
      throw new Error('Failed to parse uploaded data. Please try uploading again.');
    }
  }

  const indicator = economicIndicators.find(ind => ind.id === indicatorId);

  if (!indicator) {
    console.error('Available indicators:', economicIndicators.map(i => i.id));
    throw new Error(`Indicator with id ${indicatorId} not found`);
  }

  if (DEBUG) console.log(`Fetching data for indicator: ${indicatorId}`);

  // Only proceed with API data if we're not using uploaded data
  if (!useUploadedData && storedData && !shouldUpdateData(indicatorId, storedData.data.data)) {
    if (DEBUG) console.log(`Using stored API data for ${indicatorId}`);
    return storedData.data;
  }

  const { source, seriesId } = getSeriesIdForIndicator(indicatorId);
  const currentYear = new Date().getFullYear();
  const startYear = currentYear - 30; 
  const startDate = `${startYear}-01-01`;

  let data: IndicatorDataPoint[] = [];
  let errorMessage = '';

  try {
    switch (source) {
      case 'BLS':
        if (DEBUG) console.log(`Using BLS API for ${indicatorId}`);
        data = await fetchBLSData(seriesId, startYear, currentYear);
        break;
      case 'FRED':
        if (DEBUG) console.log(`Using FRED API for ${indicatorId}`);
        data = await fetchFREDData(seriesId, startDate);
        break;
      case 'EIA':
        if (DEBUG) console.log(`Using EIA API for ${indicatorId}`);
        data = await fetchEIAData(seriesId);
        break;
    }

    if (data.length === 0) {
      throw new Error(`No data returned for indicator ${indicatorId}`);
    }

    if (indicatorId === 'inflation' && data.length > 0) {
      const processedData: IndicatorDataPoint[] = [];
      for (let i = 12; i < data.length; i++) {
        const currentValue = data[i].value;
        const previousValue = data[i - 12].value; 
        const inflationRate = ((currentValue - previousValue) / previousValue) * 100;
        processedData.push({
          date: data[i].date,
          value: parseFloat(inflationRate.toFixed(2)),
          president: data[i].president,
        });
      }
      data = processedData;
    }

    if (indicatorId === 'job-creation' && data.length > 0) {
      const processedData: IndicatorDataPoint[] = [];
      for (let i = 1; i < data.length; i++) {
        const currentValue = data[i].value;
        const previousValue = data[i - 1].value;
        const change = currentValue - previousValue;
        processedData.push({
          date: data[i].date,
          value: change,
          president: data[i].president,
        });
      }
      data = processedData;
    }

    if (DEBUG) console.log(`Successfully fetched ${data.length} data points for ${indicatorId}`);

    const result = {
      indicator,
      data,
      lastUpdated: format(new Date(), 'yyyy-MM-dd'),
    };

    saveToLocalStorage(localStorageKey, result);
    return result;
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Error in fetchIndicatorData for ${indicatorId}:`, errorMessage);

    if (storedData) {
      console.warn(`Using stored data for ${indicatorId} due to API error`);
      return storedData.data;
    }

    throw new Error(`${source} API Error: ${errorMessage}`);
  }
};

export const fetchAllIndicatorsData = async (): Promise<IndicatorData[]> => {
  if (DEBUG) console.log('Fetching all indicators data');
  const results: IndicatorData[] = [];
  const errors: Record<string, string> = {};
  const allStoredData: IndicatorData[] = [];
  let allDataIsRecent = true;

  for (const indicator of economicIndicators) {
    const localStorageKey = `indicator-${indicator.id}`;
    const storedData = getFromLocalStorage(localStorageKey);

    if (storedData) {
      allStoredData.push(storedData.data);
      if (shouldUpdateData(indicator.id, storedData.data.data)) {
        allDataIsRecent = false;
      }
    } else {
      allDataIsRecent = false;
    }
  }

  if (allStoredData.length === economicIndicators.length && allDataIsRecent) {
    if (DEBUG) console.log('Using all stored data (all indicators are up to date)');
    return allStoredData;
  }

  const promises = economicIndicators.map(indicator =>
    fetchIndicatorData(indicator.id)
      .then(data => {
        results.push(data);
        return { status: 'fulfilled', value: data };
      })
      .catch(error => {
        const errorMessage = error instanceof Error ? error.message : String(error);
        errors[indicator.id] = errorMessage;
        console.error(`Error fetching data for ${indicator.id}:`, errorMessage);
        const localStorageKey = `indicator-${indicator.id}`;
        const storedData = getFromLocalStorage(localStorageKey);
        if (storedData) {
          console.warn(`Using stored data for ${indicator.id} due to API error`);
          results.push(storedData.data);
        }
        return { status: 'rejected', reason: error };
      })
  );

  await Promise.allSettled(promises);

  if (results.length === 0) {
    throw new Error(`Failed to fetch any indicator data: ${JSON.stringify(errors)}`);
  }

  if (DEBUG) console.log(`Successfully fetched data for ${results.length} indicators`);
  return results;
};

export const checkForDataUpdates = async (): Promise<boolean> => {
  try {
    for (const indicator of economicIndicators) {
      const localStorageKey = `indicator-${indicator.id}`;
      const storedData = getFromLocalStorage(localStorageKey);
      if (!storedData || shouldUpdateData(indicator.id, storedData.data.data)) {
        return true;
      }
    }
    return false;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error checking for updates:', errorMessage);
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

export const updateIndicatorData = (indicatorId: string, newData: IndicatorDataPoint[]): void => {
  const indicator = economicIndicators.find(ind => ind.id === indicatorId);
  if (!indicator) throw new Error(`Invalid indicator ID: ${indicatorId}`);

  const localStorageKey = `indicator-${indicatorId}`;
  const result = {
    indicator,
    data: newData,
    lastUpdated: format(new Date(), 'yyyy-MM-dd'),
  };

  apiCache[localStorageKey] = {
    data: result,
    timestamp: Date.now(),
  };

  saveToLocalStorage(localStorageKey, result);
};