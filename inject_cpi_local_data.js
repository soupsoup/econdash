const fs = require('fs');
const path = require('path');

// CPI indicator definition from src/data/indicators.ts
const cpiIndicator = {
  id: 'cpi',
  name: 'Consumer Price Index',
  description: 'Consumer Price Index for All Urban Consumers: All Items (Base: 1982-84=100)',
  unit: 'index',
  source: 'BLS',
  sourceUrl: 'https://data.bls.gov/timeseries/CUUR0000SA0&output_view=pct_12mths',
  frequency: 'monthly',
  higherIsBetter: false,
  seriesId: 'CUUR0000SA0',
  transform: 'none'
};

// Read CPI data
const cpiData = JSON.parse(fs.readFileSync(path.join(__dirname, 'cpi_local_data.json'), 'utf8'));

// Compose the localStorage object
const uploadedKey = 'economic_indicator_v3_uploaded_cpi';
const preferencesKey = 'economic_indicator_v3_data_source_preferences';

const uploadedValue = JSON.stringify({
  indicator: cpiIndicator,
  data: cpiData
});

// Read or create preferences
let preferences = {};
if (fs.existsSync(preferencesKey + '.json')) {
  preferences = JSON.parse(fs.readFileSync(preferencesKey + '.json', 'utf8'));
}
preferences['cpi'] = { useUploadedData: true };

// Write the files to disk (to be loaded by the app or imported into localStorage)
fs.writeFileSync(uploadedKey + '.json', uploadedValue, 'utf8');
fs.writeFileSync(preferencesKey + '.json', JSON.stringify(preferences, null, 2), 'utf8');

console.log('CPI local data and preference files written.');
console.log('To inject into your browser localStorage, use the contents of these files.'); 