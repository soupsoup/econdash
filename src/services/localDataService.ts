import { presidents } from '../data/presidents';

export interface LocalDataPoint {
  date: string;
  value: number;
}

export async function loadSP500Data(): Promise<LocalDataPoint[]> {
  try {
    const response = await fetch('/attached_assets/SP500_DATA.csv');
    const csvText = await response.text();

    const lines = csvText.split('\n').filter(line => line.trim().length > 0);
    const headers = lines[0].split(',');
    const dateIndex = headers.indexOf('Date');
    const valueIndex = headers.indexOf('Close');

    if (dateIndex === -1 || valueIndex === -1) {
      console.error('Required columns not found in CSV:', headers);
      return [];
    }

    const dataPoints = lines.slice(1)
      .map(line => {
        const values = line.split(',');
        if (!values[dateIndex] || !values[valueIndex]) return null;
        
        const date = new Date(values[dateIndex]);
        if (isNaN(date.getTime())) return null;
        
        const value = parseFloat(values[valueIndex].replace(/[^0-9.-]+/g, ''));
        if (isNaN(value)) return null;

        return {
          date: date.toISOString().split('T')[0],
          value: value,
          president: 'Biden'
        };
      })
      .filter((point): point is LocalDataPoint => point !== null);

    // Sort by date in ascending order
    dataPoints.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return dataPoints;
  } catch (error) {
    console.error('Error loading S&P 500 data:', error);
    return [];
  }
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