import { Handler } from '@netlify/functions';
import axios from 'axios';

const BLS_API_URL = 'https://api.bls.gov/publicAPI/v2/timeseries/data/';

interface BlsApiResponse {
  status: string;
  message?: string[];
  Results?: {
    series: Array<{
      seriesID: string;
      data: any[];
    }>;
  };
}

export const handler: Handler = async (event) => {
  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Get the series ID from the query parameters
    const seriesId = event.queryStringParameters?.seriesid;
    if (!seriesId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Series ID is required' })
      };
    }

    // Get the API key from environment variables
    const apiKey = process.env.VITE_BLS_API_KEY;
    if (!apiKey) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'BLS API key is not configured' })
      };
    }

    // Set fixed range: May 2020 to 2025
    const startYear = '2020';
    const endYear = '2025';

    // Prepare the request to BLS API
    const response = await axios.post<BlsApiResponse>(BLS_API_URL, {
      seriesid: [seriesId],
      startyear: startYear,
      endyear: endYear,
      registrationkey: apiKey,
      calculations: true,
      annualaverage: false
    }, {
      headers: {
        'Content-Type': 'application/json',
        'BLS-API-Key': apiKey
      }
    });

    // Log the full BLS API response for debugging
    console.log('BLS API raw response:', JSON.stringify(response.data, null, 2));

    // Check for rate limit error in the response
    if (response.data.status === 'REQUEST_NOT_PROCESSED' && 
        response.data.message?.some((msg: string) => msg.includes('daily threshold'))) {
      return {
        statusCode: 429,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
        },
        body: JSON.stringify({
          error: 'BLS API rate limit reached',
          message: 'Please try again later or contact support if this persists.',
          details: response.data
        })
      };
    }

    // Return the BLS API response
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
      },
      body: JSON.stringify(response.data)
    };
  } catch (error) {
    console.error('Error proxying BLS API request:', error);
    
    // Log more detailed error information
    const errorDetails = error && typeof error === 'object' && 'response' in error ? {
      status: (error.response as any)?.status,
      statusText: (error.response as any)?.statusText,
      data: (error.response as any)?.data as BlsApiResponse,
      headers: (error.response as any)?.headers
    } : undefined;
    
    if (errorDetails) {
      console.error('API error details:', errorDetails);
    }

    // Check if it's a rate limit error
    const isRateLimit = errorDetails?.data?.status === 'REQUEST_NOT_PROCESSED' && 
                       errorDetails?.data?.message?.some((msg: string) => msg.includes('daily threshold'));
    
    return {
      statusCode: isRateLimit ? 429 : 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
      },
      body: JSON.stringify({
        error: isRateLimit ? 'BLS API rate limit reached' : 'Failed to fetch data from BLS API',
        message: isRateLimit ? 'Please try again later or contact support if this persists.' : 
                (error instanceof Error ? error.message : 'Unknown error'),
        details: errorDetails
      })
    };
  }
}; 