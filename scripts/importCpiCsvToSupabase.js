const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  const csvPath = path.join(__dirname, '../CPI2005_2025.csv');
  const csv = fs.readFileSync(csvPath, 'utf-8');
  const lines = csv.trim().split('\n');
  const header = lines[0].split(',');
  const yearIdx = header.indexOf('Year');
  const monthIdx = header.indexOf('Month');
  const valueIdx = header.indexOf('Value');
  if (yearIdx === -1 || monthIdx === -1 || valueIdx === -1) throw new Error('CSV header missing required columns');

  const rows = lines.slice(1).map(line => {
    const cols = line.split(',');
    const year = cols[yearIdx];
    const month = cols[monthIdx].padStart(2, '0');
    const value = parseFloat(cols[valueIdx]);
    const date = `${year}-${month}-01`;
    return {
      indicator_id: 'cpi',
      date,
      value,
      source: 'CSV upload'
    };
  }).filter(row => !isNaN(row.value) && row.date && !isNaN(new Date(row.date).getTime()));

  const { error } = await supabase.from('indicator_data').insert(rows);
  if (error) {
    console.error('Error uploading CPI data to Supabase:', error.message);
  } else {
    console.log(`Successfully uploaded ${rows.length} CPI rows to Supabase.`);
  }
}

main();