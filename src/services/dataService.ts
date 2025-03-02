import { loadLocalJobCreationData } from './localDataService';

// Assuming this is defined elsewhere
interface IndicatorData {
  indicator: any; // Replace with your actual indicator type
  data: any[]; // Replace with your actual data type
}

const memoryCache: { [key: string]: IndicatorData | null } = {};
const indicators = [
  // ... your indicator definitions ...
  {id: 'job-creation', name: 'Job Creation'}
]

export async function fetchIndicatorData(indicatorId: string): Promise<IndicatorData | null> {
  try {
    console.log(`Fetching data for indicator: ${indicatorId}`);

    // For job-creation, use local CSV data
    if (indicatorId === 'job-creation') {
      const localData = await loadLocalJobCreationData();
      if (localData.length > 0) {
        const indicator = indicators.find(i => i.id === indicatorId);
        if (indicator) {
          const result = {
            indicator,
            data: localData
          };
          memoryCache[`indicator-${indicatorId}`] = result;
          localStorage.setItem(`indicator-${indicatorId}`, JSON.stringify(result));
          console.log(`Successfully fetched ${localData.length} data points for ${indicatorId} from local CSV`);
          return result;
        }
      }
    }

    // Check if we have this in memory cache first
    if (memoryCache[`indicator-${indicatorId}`]) {
      return memoryCache[`indicator-${indicatorId}`];
    }

    // Check if we have recent data in local storage
    const cachedData = localStorage.getItem(`indicator-${indicatorId}`);
    if (cachedData) {
      const parsedData = JSON.parse(cachedData);
      memoryCache[`indicator-${indicatorId}`] = parsedData;
      return parsedData;
    }

    // Fallback to fetching from a remote source (implementation not provided)

    return null;
  } catch (error) {
    console.error(`Error fetching data for indicator ${indicatorId}:`, error);
    return null;
  }
}

// Placeholder for local data service -  replace with your actual implementation
export async function loadLocalJobCreationData(): Promise<any[]> {
  //Implementation to read and parse the CSV file here.  Example using Papa Parse:
  const papa = require('papaparse');
  const fs = require('node:fs');
  const csvData = fs.readFileSync('job_creation_data.csv', 'utf8');
  return new Promise((resolve, reject) => {
      papa.parse(csvData, {
          complete: (results) => {
              resolve(results.data);
          },
          error: (error) => {
              reject(error);
          }
      })
  })
}