import axios from 'axios';
import { format, subYears, parseISO } from 'date-fns';
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

// Debug flag
const DEBUG = true;

// Local Storage Keys
const LOCAL_STORAGE_PREFIX = 'presidential_dashboard_';
const LAST_UPDATED_KEY = `${LOCAL_STORAGE_PREFIX}last_updated`;

// Cache for API responses to avoid unnecessary requests
const apiCache: Record<string, { data: any; timestamp: number }> = {};
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// Track API rate limit status
const apiStatus = {
  BLS: { rateLimitReached: false, lastChecked: 0 },
  FRED: { rateLimitReached: false, lastChecked: 0 },
  EIA: { rateLimitReached: false, lastChecked: 0 }
};

// Helper function to check if cache is valid
const isCacheValid = (cacheKey: string): boolean => {
  const cacheEntry = apiCache[cacheKey];
  if (!cacheEntry) return false;
  
  const now = Date.now();
  return now - cacheEntry.timestamp < CACHE_DURATION;
};

// Helper function to save data to local storage
const saveToLocalStorage = (key: string, data: any): void => {
  try {
    const serializedData = JSON.stringify({
      data,
      timestamp: Date.now()
    });
    localStorage.setItem(`${LOCAL_STORAGE_PREFIX}${key}`, serializedData);
    
    // Update last updated timestamp
    localStorage.setItem(LAST_UPDATED_KEY, Date.now().toString());
    
    if (DEBUG) console.log(`Saved data to local storage: ${key}`);
  } catch (error) {
    console.error(`Error saving to local storage: ${key}`, error);
  }
};

// Helper function to get data from local storage
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

// Helper function to check if local storage data is valid (not too old)
const isLocalStorageDataValid = (key: string): boolean => {
  const storedData = getFromLocalStorage(key);
  if (!storedData) return false;
  
  const now = Date.now();
  return now - storedData.timestamp < CACHE_DURATION;
};

// Helper function to get data from cache, local storage, or API
const getDataFromCacheOrStorageOrApi = async <T>(
  cacheKey: string,
  apiFn: () => Promise<T>,
  apiSource: 'BLS' | 'FRED' | 'EIA'
): Promise<T> => {
  // Check memory cache first (fastest)
  if (isCacheValid(cacheKey)) {
    if (DEBUG) console.log(`Using memory cached data for ${cacheKey}`);
    return apiCache[cacheKey].data;
  }
  
  // Check local storage next
  if (isLocalStorageDataValid(cacheKey)) {
    const storedData = getFromLocalStorage(cacheKey);
    if (DEBUG) console.log(`Using local storage data for ${cacheKey}`);
    
    // Update memory cache
    apiCache[cacheKey] = {
      data: storedData!.data,
      timestamp: storedData!.timestamp
    };
    
    return storedData!.data;
  }
  
  // Check if rate limit has been reached for this API
  const now = Date.now();
  const rateLimitStatus = apiStatus[apiSource];
  
  // If rate limit was reached in the last hour, try to use expired local storage data
  if (rateLimitStatus.rateLimitReached && (now - rateLimitStatus.lastChecked < 60 * 60 * 1000)) {
    if (DEBUG) console.log(`Rate limit reached for ${apiSource}, checking for expired data`);
    
    // Check for any local storage data, even if expired
    const storedData = getFromLocalStorage(cacheKey);
    if (storedData) {
      if (DEBUG) console.log(`Using expired local storage data for ${cacheKey} due to rate limit`);
      return storedData.data;
    }
    
    // No local storage data available, throw specific rate limit error
    throw new Error(`${apiSource} API rate limit reached. Please try again later.`);
  }
  
  if (DEBUG) console.log(`Fetching fresh data for ${cacheKey}`);
  
  // Always attempt to fetch from API
  try {
    const data = await apiFn();
    
    // Reset rate limit flag on successful call
    apiStatus[apiSource] = { rateLimitReached: false, lastChecked: now };
    
    // Update memory cache
    apiCache[cacheKey] = {
      data,
      timestamp: now,
    };
    
    // Save to local storage
    saveToLocalStorage(cacheKey, data);
    
    return data;
  } catch (error) {
    // Check if this is a rate limit error
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes('threshold') || 
        errorMessage.includes('rate limit') || 
        errorMessage.includes('too many requests')) {
      // Mark this API as rate limited
      apiStatus[apiSource] = { rateLimitReached: true, lastChecked: now };
      console.warn(`Rate limit detected for ${apiSource} API`);
    }
    
    // Check for any local storage data, even if expired
    const storedData = getFromLocalStorage(cacheKey);
    if (storedData) {
      if (DEBUG) console.log(`Using expired local storage data for ${cacheKey} due to API error`);
      return storedData.data;
    }
    
    // No local storage data available, rethrow the error with full details
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(`${apiSource} API Error: ${errorMessage}. Status: ${error.response.status}. Response: ${JSON.stringify(error.response.data)}`);
    } else {
      throw error;
    }
  }
};

// Safe error logging function to prevent Symbol() cloning issues
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

// BLS API Functions
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
      // BLS API requires POST method, not PUT
      const response = await axios({
        method: 'post',  // Explicitly use POST method
        url: BLS_BASE_URL,
        data: {
          seriesid: [seriesId],
          startyear: startYear.toString(),
          endyear: endYear.toString(),
          registrationkey: BLS_API_KEY,
          calculations: false,
          annualaverage: false,
        },
        timeout: 10000, // 10 second timeout
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
      
      const seriesData = response.data.Results.series[0];
      
      if (!seriesData || !seriesData.data) {
        throw new Error('No data returned from BLS API');
      }
      
      return seriesData.data.map((item: any) => {
        let dateStr: string;
        
        // Handle different period formats (M01, Q01, etc.)
        if (item.period.startsWith('M')) {
          const month = parseInt(item.period.substring(1));
          dateStr = `${item.year}-${month.toString().padStart(2, '0')}-01`;
        } else if (item.period.startsWith('Q')) {
          const quarter = parseInt(item.period.substring(1));
          const month = (quarter - 1) * 3 + 1;
          dateStr = `${item.year}-${month.toString().padStart(2, '0')}-01`;
        } else if (item.period === 'A01') {
          // Annual data
          dateStr = `${item.year}-01-01`;
        } else {
          dateStr = `${item.year}-01-01`; // Default to January 1st
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

// FRED API Functions
const fetchFREDData = async (seriesId: string, startDate: string): Promise<IndicatorDataPoint[]> => {
  const cacheKey = `fred-${seriesId}-${startDate}`;
  
  return getDataFromCacheOrStorageOrApi(cacheKey, async () => {
    // Fix for FRED API - use annual frequency for all requests to avoid the 400 error
    if (DEBUG) {
      console.log('FRED API Request:', {
        url: FRED_BASE_URL,
        params: {
          series_id: seriesId,
          api_key: FRED_API_KEY.substring(0, 5) + '...',
          file_type: 'json',
          observation_start: startDate,
          frequency: 'a', // Changed to 'a' (annual) to fix the 400 error
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
          frequency: 'a', // Changed to 'a' (annual) to fix the 400 error
        },
        timeout: 10000, // 10 second timeout
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

// EIA API Functions
const fetchEIAData = async (seriesId: string): Promise<IndicatorDataPoint[]> => {
  const cacheKey = `eia-${seriesId}`;
  
  return getDataFromCacheOrStorageOrApi(cacheKey, async () => {
    // Fix for EIA API - use correct endpoint format and series ID format
    // Try multiple formats for the series ID since the API is picky
    const seriesFormats = [
      seriesId.replace(/\//g, '.'),  // Replace slashes with dots (PET.EMM_EPM0_PTE_NUS_DPG.W)
      seriesId,                      // Original format (PET/EMM_EPM0_PTE_NUS_DPG/W)
      seriesId.replace(/\//g, '-'),  // Replace slashes with hyphens (PET-EMM_EPM0_PTE_NUS_DPG-W)
      `${seriesId.split('/')[0]}.${seriesId.split('/')[1]}.${seriesId.split('/')[2]}` // Explicit format
    ];
    
    // Try different API endpoints
    const apiEndpoints = [
      `${EIA_BASE_URL}/series`,
      `${EIA_BASE_URL}/data`
    ];
    
    let lastError: any = null;
    
    // Try all combinations of series formats and API endpoints
    for (const endpoint of apiEndpoints) {
      for (const format of seriesFormats) {
        try {
          if (DEBUG) {
            console.log(`Trying EIA API with endpoint: ${endpoint} and series format: ${format}`);
          }
          
          // For gas prices, try a different approach - use a specific endpoint
          if (seriesId.includes('EMM_EPM0_PTE_NUS_DPG')) {
            // Try the petroleum data API endpoint specifically
            // Reduced length parameter to 100 to avoid large responses
            const eiaUrl = `${EIA_BASE_URL}/petroleum/pri/gnd/data/?api_key=${EIA_API_KEY}&frequency=weekly&data[0]=value&facets[product][]=EPMR&facets[duoarea][]=NUS&sort[0][column]=period&sort[0][direction]=desc&offset=0&length=100`;
            
            if (DEBUG) {
              console.log('EIA API Request (petroleum endpoint):', {
                url: eiaUrl.replace(EIA_API_KEY, EIA_API_KEY.substring(0, 5) + '...')
              });
            }
            
            const response = await axios.get(eiaUrl, {
              timeout: 10000, // 10 second timeout
            });
            
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
          
          // Standard series API approach
          const eiaUrl = `${endpoint}?api_key=${EIA_API_KEY}&series_id=${format}`;
          
          if (DEBUG) {
            console.log('EIA API Request:', {
              url: eiaUrl.replace(EIA_API_KEY, EIA_API_KEY.substring(0, 5) + '...')
            });
          }
          
          const response = await axios.get(eiaUrl, {
            timeout: 10000, // 10 second timeout
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
          // Continue to the next attempt
        }
      }
    }
    
    // If we've tried all combinations and still failed, handle the error
    if (DEBUG) {
      console.error('EIA API Error Details (all attempts failed)');
      safeLogError('EIA API', lastError);
    }
    
    // Throw with detailed error information
    if (axios.isAxiosError(lastError) && lastError.response) {
      throw new Error(`EIA API Error: ${lastError.message}. Status: ${lastError.response.status}. Response: ${JSON.stringify(lastError.response.data)}`);
    } else {
      throw lastError || new Error('Failed to fetch EIA data after trying multiple formats');
    }
  }, 'EIA');
};

// Map indicators to their respective API series IDs
const getSeriesIdForIndicator = (indicatorId: string): { source: string; seriesId: string } => {
  switch (indicatorId) {
    case 'unemployment':
      return { source: 'BLS', seriesId: 'LNS14000000' }; // Unemployment Rate
    case 'inflation':
      return { source: 'BLS', seriesId: 'CUUR0000SA0' }; // Consumer Price Index for All Urban Consumers
    case 'gdp-growth':
      return { source: 'FRED', seriesId: 'A191RL1Q225SBEA' }; // Real GDP Growth Rate
    case 'job-creation':
      return { source: 'BLS', seriesId: 'CES0000000001' }; // Nonfarm Payroll Employment
    case 'federal-debt':
      return { source: 'FRED', seriesId: 'GFDEGDQ188S' }; // Federal Debt to GDP
    case 'gas-prices':
      // Try multiple formats for gas prices
      return { source: 'EIA', seriesId: 'PET/EMM_EPM0_PTE_NUS_DPG/W' }; // Weekly U.S. Regular All Formulations Retail Gasoline Prices
    case 'median-income':
      return { source: 'FRED', seriesId: 'MEHOINUSA672N' }; // Real Median Household Income
    case 'stock-market':
      return { source: 'FRED', seriesId: 'SP500' }; // S&P 500 Index
    default:
      throw new Error(`Unknown indicator: ${indicatorId}`);
  }
};

// Check if we need to update data based on the latest data point
const shouldUpdateData = (indicatorId: string, existingData: IndicatorDataPoint[]): boolean => {
  if (!existingData || existingData.length === 0) return true;
  
  const indicator = economicIndicators.find(ind => ind.id === indicatorId);
  if (!indicator) return true;
  
  // Sort data by date to get the latest data point
  const sortedData = [...existingData].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  
  const latestDataPoint = sortedData[0];
  const latestDate = new Date(latestDataPoint.date);
  const now = new Date();
  
  // Calculate the difference in days
  const daysDiff = Math.floor((now.getTime() - latestDate.getTime()) / (1000 * 60 * 60 * 24));
  
  // Determine if we need to update based on the indicator's frequency
  switch (indicator.frequency) {
    case 'daily':
      return daysDiff >= 1;
    case 'weekly':
      return daysDiff >= 7;
    case 'monthly':
      return daysDiff >= 30;
    case 'quarterly':
      return daysDiff >= 90;
    case 'yearly':
      return daysDiff >= 365;
    default:
      return true;
  }
};

// Fetch data for a specific indicator
export const fetchIndicatorData = async (indicatorId: string): Promise<IndicatorData> => {
  if (!indicatorId) {
    throw new Error('Indicator ID is required');
  }
  
  console.log(`Fetching indicator data for ID: ${indicatorId}`);
  const localStorageKey = `indicator-${indicatorId}`;
  const storedData = localStorage.getItem(localStorageKey);
  
  // Try to use cached data first
  if (storedData) {
    try {
      const parsed = JSON.parse(storedData);
      if (parsed && parsed.indicator && parsed.data) {
        return parsed;
      }
    } catch (e) {
      console.warn('Failed to parse stored data:', e);
    }
  }

  const indicator = economicIndicators.find(ind => ind.id === indicatorId);
  
  if (!indicator) {
    console.error('Available indicators:', economicIndicators.map(i => i.id));
    throw new Error(`Indicator with id ${indicatorId} not found`);
  }
  
  if (DEBUG) console.log(`Fetching data for indicator: ${indicatorId}`);
  
  // Check if we have data in local storage
  const localStorageKey = `indicator-${indicatorId}`;
  const storedData = getFromLocalStorage(localStorageKey);
  
  // If we have valid stored data, use it
  if (storedData && !shouldUpdateData(indicatorId, storedData.data.data)) {
    if (DEBUG) console.log(`Using stored data for ${indicatorId}`);
    return storedData.data;
  }
  
  const { source, seriesId } = getSeriesIdForIndicator(indicatorId);
  const currentYear = new Date().getFullYear();
  const startYear = currentYear - 30; // Get 30 years of data
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
    
    // Process data if needed (e.g., calculate inflation rate from CPI)
    if (indicatorId === 'inflation' && data.length > 0) {
      // Convert CPI to inflation rate (year-over-year percentage change)
      const processedData: IndicatorDataPoint[] = [];
      
      for (let i = 12; i < data.length; i++) {
        const currentValue = data[i].value;
        const previousValue = data[i - 12].value; // 12 months ago
        const inflationRate = ((currentValue - previousValue) / previousValue) * 100;
        
        processedData.push({
          date: data[i].date,
          value: parseFloat(inflationRate.toFixed(2)),
          president: data[i].president,
        });
      }
      
      data = processedData;
    }
    
    // Process job creation data (monthly change)
    if (indicatorId === 'job-creation' && data.length > 0) {
      const processedData: IndicatorDataPoint[] = [];
      
      for (let i = 1; i < data.length; i++) {
        const currentValue = data[i].value;
        const previousValue = data[i - 1].value;
        // Use actual job numbers instead of thousands
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
    
    // Save to local storage
    saveToLocalStorage(localStorageKey, result);
    
    return result;
  } catch (error) {
    // Convert error to string to avoid Symbol() cloning issues
    errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Error in fetchIndicatorData for ${indicatorId}:`, errorMessage);
    
    // Check if we have any stored data to use as fallback
    if (storedData) {
      console.warn(`Using stored data for ${indicatorId} due to API error`);
      return storedData.data;
    }
    
    // Throw the error with source information
    throw new Error(`${source} API Error: ${errorMessage}`);
  }
};

// Fetch all indicators data
export const fetchAllIndicatorsData = async (): Promise<IndicatorData[]> => {
  if (DEBUG) console.log('Fetching all indicators data');
  
  const results: IndicatorData[] = [];
  const errors: Record<string, string> = {};
  
  // Check if we have all data in local storage and if it's recent enough
  const allStoredData: IndicatorData[] = [];
  let allDataIsRecent = true;
  
  for (const indicator of economicIndicators) {
    const localStorageKey = `indicator-${indicator.id}`;
    const storedData = getFromLocalStorage(localStorageKey);
    
    if (storedData) {
      allStoredData.push(storedData.data);
      
      // Check if the data is recent enough
      if (shouldUpdateData(indicator.id, storedData.data.data)) {
        allDataIsRecent = false;
      }
    } else {
      allDataIsRecent = false;
    }
  }
  
  // If we have all data and it's recent enough, use it
  if (allStoredData.length === economicIndicators.length && allDataIsRecent) {
    if (DEBUG) console.log('Using all stored data (all indicators are up to date)');
    return allStoredData;
  }
  
  // Use Promise.allSettled to handle individual indicator failures
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
        
        // Try to use stored data as fallback
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

// Check for data updates
export const checkForDataUpdates = async (): Promise<boolean> => {
  try {
    // Check if any indicators need updating
    for (const indicator of economicIndicators) {
      const localStorageKey = `indicator-${indicator.id}`;
      const storedData = getFromLocalStorage(localStorageKey);
      
      if (!storedData || shouldUpdateData(indicator.id, storedData.data.data)) {
        return true;
      }
    }
    
    return false;
  } catch (error) {
    // Convert error to string to avoid Symbol() cloning issues
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error checking for updates:', errorMessage);
    return false;
  }
};

// Get the last updated timestamp
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

// Clear all stored data (for debugging or resetting)
export const clearAllStoredData = (): void => {
  try {
    // Clear all items with our prefix
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