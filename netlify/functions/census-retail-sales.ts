import { Handler } from '@netlify/functions';
import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const CENSUS_URL = 'https://api.census.gov/data/timeseries/eits/marts?get=cell_value,time_slot_id&data_type_code=SM&seasonally_adj=no&category_code=44X72&time=from+2005-01+to+2025-04';

export const handler: Handler = async (event) => {
  try {
    const response = await fetch(CENSUS_URL);
    if (!response.ok) {
      return { statusCode: 500, body: 'Failed to fetch Census Retail Sales data' };
    }
    const data = await response.json();
    // The first row is the header
    const rows = data.slice(1).map((row: any[]) => ({
      indicator_id: 'census-retail-sales',
      date: row[1] ? `${row[1]}-01` : '', // time_slot_id to YYYY-MM-01
      value: parseFloat(row[0]), // cell_value
      source: 'Census API'
    })).filter(row => !isNaN(row.value) && row.date && !isNaN(new Date(row.date).getTime()));

    // If ?import=true, insert into Supabase
    if (event.queryStringParameters && event.queryStringParameters.import === 'true') {
      const { error } = await supabase.from('indicator_data').insert(rows);
      if (error) {
        return { statusCode: 500, body: 'Supabase insert error: ' + error.message };
      }
      return { statusCode: 200, body: `Imported ${rows.length} rows into Supabase.` };
    }

    return {
      statusCode: 200,
      body: JSON.stringify(rows)
    };
  } catch (error: any) {
    return {
      statusCode: 500,
      body: error.message || 'Unknown error'
    };
  }
}; 