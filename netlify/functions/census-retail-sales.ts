import { Handler } from '@netlify/functions';
import axios from 'axios';

const CENSUS_API_KEY = process.env.CENSUS_API_KEY || '687f3f67d2717e85a033b62e5cbd9c01c62eb86a';
const CENSUS_API_URL = 'https://api.census.gov/data/timeseries/eits/marts';

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Use the correct time range format for the current year
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const url = `${CENSUS_API_URL}?get=cell_value,time_slot_id&data_type_code=SM&seasonally_adj=Y&category_code=44X72&time=from+${year}-01+to+${year}-${month}&key=${CENSUS_API_KEY}`;
    const response = await axios.get(url);
    const data = response.data as any;
    const headers = data[0];
    const rows = data.slice(1);
    const result = rows.map((row: any[]) => {
      const time = row[headers.indexOf('time_slot_id')];
      const year = time.slice(0, 4);
      const month = time.slice(4, 6);
      return {
        date: `${year}-${month}-01`,
        value: parseFloat(row[headers.indexOf('cell_value')])
      };
    }).filter((point: any) => !isNaN(point.value) && point.value !== null)
      .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
      },
      body: JSON.stringify(result)
    };
  } catch (error) {
    console.error('Error fetching Census Retail Sales data:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch Census Retail Sales data', details: error instanceof Error ? error.message : error })
    };
  }
}; 