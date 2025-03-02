
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
