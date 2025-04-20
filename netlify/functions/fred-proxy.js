const axios = require('axios');

exports.handler = async function(event) {
  console.log('Function invoked with event:', {
    path: event.path,
    httpMethod: event.httpMethod,
    queryStringParameters: event.queryStringParameters,
    headers: event.headers,
    rawUrl: event.rawUrl
  });

  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    // Log all environment variables (excluding sensitive ones)
    console.log('Environment variables:', {
      nodeEnv: process.env.NODE_ENV,
      hasApiKey: !!process.env.FRED_API_KEY,
      apiKeyLength: process.env.FRED_API_KEY ? process.env.FRED_API_KEY.length : 0,
      envVars: Object.keys(process.env).filter(key => !key.includes('KEY') && !key.includes('SECRET')),
      deployUrl: process.env.DEPLOY_URL,
      netlifyContext: process.env.CONTEXT
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
            context: process.env.CONTEXT,
            url: event.rawUrl
          }
        })
      };
    }

    // Parse and validate query parameters
    const params = new URLSearchParams(event.queryStringParameters || {});
    
    // Log the incoming request parameters
    console.log('Request parameters:', {
      originalParams: event.queryStringParameters,
      parsedParams: Object.fromEntries(params.entries())
    });

    // Check for required series_id
    if (!params.get('series_id')) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ 
          error: 'series_id parameter is required',
          receivedParams: event.queryStringParameters
        })
      };
    }

    // Add required parameters
    params.append('api_key', process.env.FRED_API_KEY);
    params.set('file_type', 'json');

    // Construct the FRED API URL
    const fredUrl = `https://api.stlouisfed.org/fred/series/observations?${params.toString()}`;
    
    console.log('Making FRED API request:', {
      url: fredUrl.replace(process.env.FRED_API_KEY, 'REDACTED'),
      params: Object.fromEntries(params.entries())
    });

    // Make the request to FRED API with extended timeout
    const response = await axios.get(fredUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'AmericaEcon/1.0'
      },
      timeout: 30000 // 30 second timeout
    });

    console.log('FRED API response:', {
      status: response.status,
      headers: response.headers,
      dataSize: JSON.stringify(response.data).length,
      observationCount: response.data.observations?.length
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=3600'
      },
      body: JSON.stringify(response.data)
    };
  } catch (error) {
    console.error('Detailed error information:', {
      message: error.message,
      name: error.name,
      stack: error.stack,
      axiosError: {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        headers: error.response?.headers,
        config: {
          url: error.config?.url?.replace(process.env.FRED_API_KEY, 'REDACTED'),
          method: error.config?.method,
          headers: error.config?.headers,
          timeout: error.config?.timeout
        }
      }
    });

    return {
      statusCode: error.response?.status || 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: error.response?.data?.error_message || error.message,
        debug: {
          timestamp: new Date().toISOString(),
          environment: process.env.NODE_ENV,
          context: process.env.CONTEXT,
          requestUrl: event.rawUrl,
          responseStatus: error.response?.status,
          responseStatusText: error.response?.statusText
        }
      })
    };
  }
}; 