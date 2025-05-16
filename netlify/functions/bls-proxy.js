const axios = require('axios');

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    const body = JSON.parse(event.body);
    const apiKey = process.env.BLS_API_KEY;
    if (!apiKey) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'BLS API key not configured' })
      };
    }

    // Default to CPI-U 12-month percent change if not specified
    const seriesid = body.seriesid || ['CUUR0000SA0'];
    const startyear = body.startyear || '2015';
    const endyear = body.endyear || new Date().getFullYear().toString();

    const payload = {
      seriesid,
      startyear,
      endyear,
      registrationkey: apiKey
    };

    const response = await axios.post('https://api.bls.gov/publicAPI/v2/timeseries/data/', payload, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    return {
      statusCode: 200,
      body: JSON.stringify(response.data)
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message, details: error.response?.data })
    };
  }
}; 