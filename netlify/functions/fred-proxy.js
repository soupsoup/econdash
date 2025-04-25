const fetch = require('node-fetch');

exports.handler = async function(event, context) {
  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    };
  }

  try {
    // Get the FRED API key from environment variables
    const apiKey = process.env.VITE_FRED_API_KEY;
    
    if (!apiKey) {
      console.error('FRED API key is missing in environment variables');
      return {
        statusCode: 500,
        body: JSON.stringify({ 
          error: 'FRED API key not configured',
          environment: process.env.NODE_ENV,
          context: process.env.CONTEXT
        }),
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      };
    }

    // Get the path and query parameters from the request
    const path = event.path.replace('/api/fred', '');
    const params = new URLSearchParams(event.queryStringParameters || {});
    
    // Remove any client-side API key
    params.delete('api_key');
    
    // Add the server-side API key
    params.append('api_key', apiKey);

    // Construct the FRED API URL
    const fredUrl = `https://api.stlouisfed.org/fred${path}?${params.toString()}`;

    console.log('Making request to FRED API:', {
      path: path,
      hasApiKey: !!apiKey,
      params: Object.fromEntries(params)
    });

    // Make the request to FRED API
    const response = await fetch(fredUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'EconDashboard/1.0'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('FRED API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });
      return {
        statusCode: response.status,
        body: JSON.stringify(errorData),
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      };
    }

    const data = await response.json();

    // Return the response from FRED
    return {
      statusCode: 200,
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=3600'
      }
    };
  } catch (error) {
    console.error('FRED API proxy error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Internal server error',
        details: error.message,
        path: event.path,
        environment: process.env.NODE_ENV,
        context: process.env.CONTEXT
      }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    };
  }
}; 