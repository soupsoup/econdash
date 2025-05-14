import { presidents } from '../data/presidents';

export interface LocalDataPoint {
  date: string;
  value: number;
}

export async function loadLocalJobCreationData(): Promise<LocalDataPoint[]> {
  try {
    // The CSV file is static and included in the build
    const response = await fetch('/attached_assets/NONFARMPAYROLL_FRED.csv');
    const csvText = await response.text();
    
    // Parse CSV
    const lines = csvText.split('\n').filter(line => line.trim().length > 0);
    const headers = lines[0].split(',');
    const dateIndex = headers.indexOf('observation_date');
    const valueIndex = headers.indexOf('PAYEMS');
    
    // Skip header row and parse data
    const dataPoints = lines.slice(1).map(line => {
      const values = line.split(',');
      return {
        date: values[dateIndex],
        value: parseFloat(values[valueIndex])
      };
    });
    
    // Sort by date
    dataPoints.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // Add president information
    const dataPointsWithPresident = dataPoints.map(point => {
      const date = new Date(point.date);
      const president = presidents.find(p => {
        const startDate = new Date(p.term.start);
        const endDate = p.term.end ? new Date(p.term.end) : new Date();
        return date >= startDate && date <= endDate;
      });
      
      return {
        ...point,
        president: president?.name || 'Unknown'
      };
    });
    
    return dataPointsWithPresident;
  } catch (error) {
    console.error('Error loading local job creation data:', error);
    return [];
  }
}
import { DataPoint } from '../types';

// Function to parse CSV data from the NONFARMPAYROLL_FRED.csv file
export const parseNonFarmPayrollCsv = (csvData: string): DataPoint[] => {
  const lines = csvData.trim().split('\n');
  // Skip header
  const dataLines = lines.slice(1);
  
  return dataLines.map(line => {
    const [dateStr, valueStr] = line.split(',');
    return {
      date: new Date(dateStr).toISOString().split('T')[0],
      value: parseFloat(valueStr),
      label: `${parseFloat(valueStr).toLocaleString()} jobs`
    };
  });
};

// Function to convert the loaded CSV data into the format expected by your app
export const getJobCreationDataFromCsv = (): DataPoint[] => {
  try {
    // The CSV data has been uploaded to your project
    // You would need to load this file or have it imported
    // For now, we'll return an empty array
    return [];
  } catch (error) {
    console.error('Error loading job creation data from CSV:', error);
    return [];
  }
};

// Utility to parse CPI2005_2025.csv and store as fallback CPI data
export async function importCpiCsvToLocalStorage(csvUrl: string = '/CPI2005_2025.csv') {
  try {
    const response = await fetch(csvUrl);
    if (!response.ok) throw new Error('Failed to fetch CPI CSV');
    const text = await response.text();
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    const header = lines[0].split(',');
    const yearIdx = header.indexOf('Year');
    const monthIdx = header.indexOf('Month');
    const valueIdx = header.indexOf('Value');
    if (yearIdx === -1 || monthIdx === -1 || valueIdx === -1) throw new Error('CSV header missing required columns');
    const data = lines.slice(1).map(line => {
      const cols = line.split(',');
      const year = cols[yearIdx];
      const month = cols[monthIdx].padStart(2, '0');
      const value = parseFloat(cols[valueIdx]);
      const date = `${year}-${month}-01`;
      return {
        date,
        value
      };
    })
    // Only keep rows with valid date and value
    .filter(row => !isNaN(row.value) && row.date && !isNaN(new Date(row.date).getTime()));
    // Store in localStorage under the same key as BLS API cache
    const cacheKey = 'economic_indicator_v3_api_cpi';
    localStorage.setItem(cacheKey, JSON.stringify({ data, timestamp: Date.now(), source: 'csv' }));
    return data;
  } catch (error) {
    console.error('Error importing CPI CSV:', error);
    throw error;
  }
}
