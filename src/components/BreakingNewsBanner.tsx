import React, { useState, useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';

const BREAKING_NEWS_KEY = 'breaking_news';

interface BreakingNews {
  message: string;
  timestamp: string;
  isActive: boolean;
}

export const BreakingNewsBanner: React.FC = () => {
  const [news, setNews] = useState<BreakingNews | null>(null);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const storedNews = localStorage.getItem(BREAKING_NEWS_KEY);
    if (storedNews) {
      const parsedNews = JSON.parse(storedNews);
      if (parsedNews.isActive) {
        setNews(parsedNews);
      }
    }
  }, []);

  if (!news || !isVisible) return null;

  return (
    <div className="bg-ink text-paper">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-paper mr-2" />
            <p className="text-sm text-paper">
              {news.message}
              <span className="text-xs text-paper/70 ml-2">
                ({new Date(news.timestamp).toLocaleString()})
              </span>
            </p>
          </div>
          <button
            onClick={() => setIsVisible(false)}
            className="text-paper/70 hover:text-paper"
            aria-label="Dismiss breaking news"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}; 