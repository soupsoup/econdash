const axios = require('axios');

exports.handler = async function(event) {
  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    // Enhanced debug logging
    console.log('Environment check:', {
      hasApiKey: !!process.env.FRED_API_KEY,
      envVarKeys: Object.keys(process.env).filter(key => !key.includes('KEY') && !key.includes('SECRET')),
      requestPath: event.path,
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
          debug: {
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV,
            context: 'netlify function'
          }
        })
      };
    }

    // Parse the query parameters
    const params = new URLSearchParams(event.queryStringParameters);
    params.append('api_key', process.env.FRED_API_KEY);
    params.append('file_type', 'json');

    // Construct the FRED API URL
    const fredUrl = `https://api.stlouisfed.org/fred/series/observations?${params.toString()}`;
    
    console.log('Making FRED API request:', {
      url: fredUrl.replace(process.env.FRED_API_KEY, 'REDACTED'),
      params: Object.fromEntries(params.entries())
    });

    // Make the request to FRED API
    const response = await axios.get(fredUrl, {
      headers: {
        'Accept': 'application/json',
      }
    });

    console.log('FRED API response:', {
      status: response.status,
      dataSize: JSON.stringify(response.data).length,
      observationCount: response.data.observations?.length
    });

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
    console.error('Proxy error details:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      stack: error.stack
    });

    return {
      statusCode: error.response?.status || 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: error.response?.data?.error_message || error.message,
        details: error.response?.data,
        debug: {
          timestamp: new Date().toISOString(),
          environment: process.env.NODE_ENV,
          requestPath: event.path,
          queryParams: event.queryStringParameters
        }
      })
    };
  }
}; 