const axios = require('axios');

exports.handler = async function(event) {
  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    // Parse the query parameters
    const params = new URLSearchParams(event.queryStringParameters);
    
    // Add the API key from environment variable
    params.append('api_key', process.env.FRED_API_KEY);
    
    // Make the request to FRED API
    const response = await axios.get(`https://api.stlouisfed.org/fred/series/observations?${params.toString()}`, {
      headers: {
        'Accept': 'application/json',
      }
    });

    // Return the response
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(response.data)
    };
  } catch (error) {
    console.error('Proxy error:', error);
    return {
      statusCode: error.response?.status || 500,
      body: JSON.stringify({
        error: error.message
      })
    };
  }
}; 