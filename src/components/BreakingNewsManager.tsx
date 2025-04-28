import React, { useState, useEffect } from 'react';
import { Save, X, AlertTriangle } from 'lucide-react';

const BREAKING_NEWS_KEY = 'breaking_news';

interface BreakingNews {
  message: string;
  timestamp: string;
  isActive: boolean;
}

export const BreakingNewsManager: React.FC = () => {
  const [message, setMessage] = useState('');
  const [currentNews, setCurrentNews] = useState<BreakingNews | null>(null);

  useEffect(() => {
    // Load existing breaking news on component mount
    const storedNews = localStorage.getItem(BREAKING_NEWS_KEY);
    if (storedNews) {
      setCurrentNews(JSON.parse(storedNews));
    }
  }, []);

  const handleSave = () => {
    if (!message.trim()) return;

    const news: BreakingNews = {
      message: message.trim(),
      timestamp: new Date().toISOString(),
      isActive: true
    };

    localStorage.setItem(BREAKING_NEWS_KEY, JSON.stringify(news));
    setCurrentNews(news);
    setMessage('');
  };

  const handleClear = () => {
    localStorage.removeItem(BREAKING_NEWS_KEY);
    setCurrentNews(null);
    setMessage('');
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h2 className="text-lg font-semibold mb-4 flex items-center">
        <AlertTriangle className="h-5 w-5 mr-2 text-yellow-500" />
        Breaking News Manager
      </h2>
      
      <div className="space-y-4">
        <div>
          <label htmlFor="breakingNews" className="block text-sm font-medium text-gray-700 mb-2">
            New Breaking News Message
          </label>
          <textarea
            id="breakingNews"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
            placeholder="Enter breaking news message..."
          />
        </div>

        <div className="flex space-x-2">
          <button
            onClick={handleSave}
            className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            disabled={!message.trim()}
          >
            <Save className="h-4 w-4 mr-1" />
            Save
          </button>
          <button
            onClick={handleClear}
            className="flex items-center px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            <X className="h-4 w-4 mr-1" />
            Clear Current News
          </button>
        </div>

        {currentNews && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <h3 className="text-sm font-medium text-yellow-800 mb-1">Current Breaking News</h3>
            <p className="text-sm text-yellow-700">{currentNews.message}</p>
            <p className="text-xs text-yellow-600 mt-1">
              Posted: {new Date(currentNews.timestamp).toLocaleString()}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}; 