const axios = require('axios');

exports.handler = async function(event) {
  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    // Log the incoming request
    console.log('Incoming request:', {
      path: event.path,
      queryParams: event.queryStringParameters
    });

    // Check if FRED API key is present
    if (!process.env.FRED_API_KEY) {
      console.error('FRED API key is missing in environment variables');
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ 
          error: 'FRED API key is not configured',
          message: 'The FRED API key environment variable is missing. Please configure it in the Netlify dashboard.',
          debug: {
            availableEnvVars: Object.keys(process.env).filter(key => !key.includes('KEY') && !key.includes('TOKEN')),
            path: event.path,
            queryParams: event.queryStringParameters
          }
        })
      };
    }

    // Parse the query parameters
    const params = new URLSearchParams(event.queryStringParameters);
    
    // Add the API key from environment variable
    params.append('api_key', process.env.FRED_API_KEY);

    // Construct the FRED API URL
    const fredUrl = `https://api.stlouisfed.org/fred/series/observations?${params.toString()}`;
    
    console.log('Requesting FRED API:', fredUrl.replace(process.env.FRED_API_KEY, 'REDACTED'));

    // Make the request to FRED API
    const response = await axios.get(fredUrl, {
      headers: {
        'Accept': 'application/json',
      }
    });

    console.log('FRED API response status:', response.status);

    // Return the response
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
      },
      body: JSON.stringify(response.data)
    };
  } catch (error) {
    console.error('Proxy error:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });

    return {
      statusCode: error.response?.status || 500,
      body: JSON.stringify({
        error: error.response?.data?.error_message || error.message,
        details: error.response?.data
      })
    };
  }
}; 