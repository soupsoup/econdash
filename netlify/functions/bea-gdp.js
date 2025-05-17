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
    const results = response.data.BEAAPI.Results;
    if (!results || !results.Data) {
      return {
        statusCode: 502,
        body: JSON.stringify({ error: 'No data returned from BEA' })
      };
    }
    // Filter for LineDescription = 'Percent change from preceding period'
    const gdpData = results.Data.filter(d => d.LineDescription === 'Percent change from preceding period');
    // Map to { date, value }
    const formatted = gdpData.map(d => ({
      date: `${d.TimePeriod}-01`, // e.g., 2025Q1 -> 2025-01-01
      value: parseFloat(d.DataValue)
    }));
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