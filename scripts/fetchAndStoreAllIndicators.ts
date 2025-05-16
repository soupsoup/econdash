import { fetchIndicatorData } from '../src/services/api';
import { createClient } from '@supabase/supabase-js';
import { economicIndicators } from '../src/data/indicators';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  for (const indicator of economicIndicators) {
    try {
      const data = await fetchIndicatorData(indicator.id);
      if (!data || !data.data || data.data.length === 0) {
        console.warn(`No data for ${indicator.id}`);
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
        console.error(`Error saving ${indicator.id} to Supabase:`, error.message);
      } else {
        console.log(`Saved ${rows.length} rows for ${indicator.id} to Supabase.`);
      }
    } catch (err: any) {
      console.error(`Failed to fetch/store ${indicator.id}:`, err.message);
      // You can provide a CSV for this indicator
    }
  }
}

main(); 