import { Handler } from '@netlify/functions';
import { fetchIndicatorData } from '../../src/services/api';
import { createClient } from '@supabase/supabase-js';
import { economicIndicators } from '../../src/data/indicators';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const results: any[] = [];
  for (const indicator of economicIndicators) {
    try {
      const data = await fetchIndicatorData(indicator.id);
      if (!data || !data.data || data.data.length === 0) {
        results.push({ indicator: indicator.id, status: 'no_data' });
        continue;
      }
      // Save to Supabase
      const rows = data.data.map((row: any) => ({
        indicator_id: indicator.id,
        date: row.date,
        value: row.value,
        source: indicator.source,
      }));
      const { error } = await supabase.from('indicator_data').insert(rows);
      if (error) {
        results.push({ indicator: indicator.id, status: 'error', error: error.message });
      } else {
        results.push({ indicator: indicator.id, status: 'saved', count: rows.length });
      }
    } catch (err: any) {
      results.push({ indicator: indicator.id, status: 'fetch_failed', error: err.message });
    }
  }
  return {
    statusCode: 200,
    body: JSON.stringify(results)
  };
}; 