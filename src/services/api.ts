import { format } from 'date-fns';
import { IndicatorData, IndicatorDataPoint } from '../types';
import { economicIndicators } from '../data/indicators';

const LOCAL_STORAGE_PREFIX = 'presidential_dashboard_';
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
  if (!indicatorId) {
    throw new Error('Indicator ID is required');
  }

  const localStorageKey = `indicator-${indicatorId}`;
  const storedData = getFromLocalStorage(localStorageKey);

  if (!storedData) {
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

export const updateIndicatorData = (indicatorId: string, newData: IndicatorDataPoint[]): void => {
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
};