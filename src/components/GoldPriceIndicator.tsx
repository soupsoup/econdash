import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { economicIndicators } from '../data/indicators';

interface MetalPriceData {
  rates: {
    XAU: number;
    EUR: number;
  };
  base: string;
  timestamp: number;
}

const GoldPriceIndicator: React.FC = () => {
  const [priceData, setPriceData] = useState<MetalPriceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [visibleCharts] = useLocalStorage<string[]>('visibleCharts', 
    economicIndicators.map(i => i.id));

  // Check if gold price indicator is visible
  const isVisible = visibleCharts.includes('gold-price');
  if (!isVisible) return null;

  useEffect(() => {
    const fetchGoldPrice = async () => {
      try {
        setLoading(true);
        const response = await axios.get<MetalPriceData>('/api/metal/v1/latest?base=USD&currencies=EUR,XAU');
        setPriceData(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching gold price:', err);
        setError('Failed to fetch gold price data');
      } finally {
        setLoading(false);
      }
    };

    fetchGoldPrice();
    // Refresh every minute
    const interval = setInterval(fetchGoldPrice, 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4">
        <h2 className="text-lg font-semibold mb-2">Gold Price</h2>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-24 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-32"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4">
        <h2 className="text-lg font-semibold mb-2">Gold Price</h2>
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  if (!priceData) return null;

  // Calculate price per ounce (XAU is in troy ounces)
  const pricePerOunce = 1 / priceData.rates.XAU;

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold">Gold Price</h2>
        <span className="text-sm text-gray-500">
          {new Date(priceData.timestamp * 1000).toLocaleTimeString()}
        </span>
      </div>
      <div className="flex items-baseline">
        <span className="text-2xl font-bold">${pricePerOunce.toFixed(2)}</span>
        <span className="ml-2 text-sm text-gray-500">per troy oz</span>
      </div>
      <div className="mt-2 text-sm">
        <span className="text-gray-500">EUR: €{(pricePerOunce / priceData.rates.EUR).toFixed(2)}</span>
      </div>
    </div>
  );
};

export default GoldPriceIndicator; 