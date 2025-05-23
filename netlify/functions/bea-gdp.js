const axios = require('axios');

exports.handler = async function(event, context) {
  const apiKey = process.env.BEA_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'BEA API key not configured' })
    };
  }

  // Allow optional year param, default to ALL
  const year = event.queryStringParameters?.year || 'ALL';

  const url = 'https://apps.bea.gov/api/data/';
  const params = {
    UserID: apiKey,
    method: 'GetData',
    datasetname: 'NIPA',
    TableName: 'T10101', // Table 1.1.1. Percent Change From Preceding Period in Real Gross Domestic Product
    Frequency: 'Q',
    Year: year,
    ResultFormat: 'JSON'
  };

  try {
    const response = await axios.get(url, { params });
    console.log('BEA API raw response:', JSON.stringify(response.data));
    const results = response.data.BEAAPI.Results;
    console.log('Full BEA Results.Data:', JSON.stringify(results.Data, null, 2));
    if (!results || !results.Data) {
      return {
        statusCode: 502,
        body: JSON.stringify({ error: 'No data returned from BEA', raw: response.data })
      };
    }
    // Filter for LineDescription = 'Gross domestic product, current dollars'
    const gdpData = results.Data.filter(d => d.LineDescription === 'Gross domestic product, current dollars');
    // Map to { date, value } with correct date formatting
    const quarterToMonth = { Q1: '01', Q2: '04', Q3: '07', Q4: '10' };
    const formatted = gdpData.map(d => {
      const [year, q] = d.TimePeriod.split('Q');
      const month = quarterToMonth['Q' + q];
      return {
        date: `${year}-${month}-01`,
        value: parseFloat(d.DataValue)
      };
    });
    return {
      statusCode: 200,
      body: JSON.stringify({ data: formatted })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
}; 