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

    // Parse and validate query parameters
    const params = new URLSearchParams(event.queryStringParameters);
    
    // Check for required series_id
    if (!params.get('series_id')) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'series_id parameter is required' })
      };
    }

    // Add required parameters
    params.append('api_key', process.env.FRED_API_KEY);
    params.set('file_type', 'json'); // Ensure JSON response

    // Construct the FRED API URL
    const fredUrl = `https://api.stlouisfed.org/fred/series/observations?${params.toString()}`;
    
    console.log('Making FRED API request:', {
      url: fredUrl.replace(process.env.FRED_API_KEY, 'REDACTED'),
      params: Object.fromEntries(params)
    });

    // Make the request to FRED API
    const response = await axios.get(fredUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'AmericaEcon/1.0'
      },
      timeout: 10000 // 10 second timeout
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

    // Handle specific FRED API errors
    const errorStatus = error.response?.status || 500;
    const errorMessage = error.response?.data?.error_message || error.message;
    
    return {
      statusCode: errorStatus,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: errorMessage,
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