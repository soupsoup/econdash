import { Handler } from '@netlify/functions';
import axios from 'axios';

const METAL_API_KEY = process.env.VITE_METAL_PRICE_API_KEY;
const METAL_API_URL = 'https://api.metalpriceapi.com/v1/latest';

// Fetches the latest gold price (XAU/USD)
export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  if (!METAL_API_KEY) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'MetalPriceAPI key is not configured' })
    };
  }

  try {
    const response = await axios.get(METAL_API_URL, {
      params: {
        api_key: METAL_API_KEY,
        base: 'USD',
        symbols: 'XAU'
      }
    });

    // Response format: { rates: { XAU: price } }
    const price = (response.data as any)?.rates?.XAU ? 1 / (response.data as any).rates.XAU : null;
    const today = new Date().toISOString().split('T')[0];
    const data = price ? [{ date: today, value: price }] : [];

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
      },
      body: JSON.stringify(data)
    };
  } catch (error) {
    console.error('Error fetching latest gold price:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch latest gold price', details: error instanceof Error ? error.message : error })
    };
  }
}; 