const testFredApi = async () => {
  const FRED_API_KEY = '08baf631b4523fb0d66722ab2d546a88';
  const series = 'UNRATE'; // Unemployment Rate series
  
  const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${series}&api_key=${FRED_API_KEY}&file_type=json&observation_start=1950-01-01&frequency=m&aggregation_method=avg&sort_order=desc&units=lin`;
  
  console.log('Testing FRED API...');
  console.log('URL:', url);
  
  try {
    const response = await fetch(url);
    const contentType = response.headers.get('content-type');
    console.log('Response status:', response.status);
    console.log('Content type:', contentType);
    
    if (!response.ok) {
      const text = await response.text();
      console.error('Error response:', text);
      return;
    }
    
    const data = await response.json();
    console.log('Success! First observation:', data.observations[0]);
    console.log('Total observations:', data.observations.length);
  } catch (error) {
    console.error('Error:', error);
  }
};

testFredApi(); 