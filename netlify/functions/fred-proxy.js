const fetch = require('node-fetch');

exports.handler = async function(event, context) {
  // Log the full request details
  console.log('Netlify Function Request:', {
    httpMethod: event.httpMethod,
    path: event.path,
    queryParams: event.queryStringParameters,
    headers: event.headers,
    origin: event.headers.origin || event.headers.Origin,
    referer: event.headers.referer || event.headers.Referer
  });

  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    };
  }

  // Handle OPTIONS requests for CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    };
  }

  try {
    // Get the FRED API key from environment variables
    const apiKey = process.env.FRED_API_KEY || process.env.VITE_FRED_API_KEY;
    
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

    // Get the query parameters and ensure they're properly formatted
    const params = new URLSearchParams(event.queryStringParameters || {});
    
    // Remove any client-side API key
    params.delete('api_key');
    
    // Add the server-side API key
    params.append('api_key', apiKey);

    // Ensure we have the required parameters
    if (!params.has('series_id')) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required parameter: series_id' }),
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      };
    }

    // Always ensure file_type is json
    params.set('file_type', 'json');

    // Construct the FRED API URL - always use the series/observations endpoint
    const fredUrl = `https://api.stlouisfed.org/fred/series/observations?${params.toString()}`;

    console.log('Making request to FRED API:', {
      hasApiKey: !!apiKey,
      params: Object.fromEntries(params),
      fullUrl: fredUrl.replace(apiKey, 'REDACTED')
    });

    // Make the request to FRED API with retries
    let response;
    let retries = 3;
    while (retries > 0) {
      try {
        response = await fetch(fredUrl, {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'EconDashboard/1.0'
          }
        });
        break;
      } catch (error) {
        retries--;
        if (retries === 0) throw error;
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log('FRED API Response:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('FRED API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      return {
        statusCode: response.status,
        body: errorText,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      };
    }

    const data = await response.json();
    console.log('FRED API Success:', {
      dataKeys: Object.keys(data),
      observationCount: data.observations?.length,
      sampleData: data.observations?.[0]
    });

    // Return the response from FRED with no-cache headers
    return {
      statusCode: 200,
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    };
  } catch (error) {
    console.error('FRED API proxy error:', {
      error: error.message,
      stack: error.stack,
      environment: process.env.NODE_ENV,
      context: process.env.CONTEXT
    });
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Internal server error',
        details: error.message,
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