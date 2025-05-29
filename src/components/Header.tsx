import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, BarChart3, Database, Newspaper } from 'lucide-react';

interface HeaderProps {
  lastUpdated?: string | null;
  hasNewData?: boolean;
  onRefresh?: () => void;
}

export default function Header({ lastUpdated, hasNewData, onRefresh }: HeaderProps) {
  return (
    <header className="bg-white shadow">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <Link to="/" className="text-xl font-bold text-gray-800">
              America Econ
            </Link>
            <nav className="hidden md:flex space-x-4">
              <Link to="/" className="text-gray-600 hover:text-gray-900 flex items-center">
                <BarChart3 className="h-4 w-4 mr-1" />
                Dashboard
              </Link>
              <Link to="/posts" className="text-gray-600 hover:text-gray-900 flex items-center">
                <Newspaper className="h-4 w-4 mr-1" />
                Updates
              </Link>
            </nav>
          </div>
          
          <div className="flex items-center space-x-4">
            {lastUpdated && (
              <div className="flex items-center text-sm text-gray-500">
                <Clock className="h-4 w-4 mr-1" />
                Last updated: {new Date(lastUpdated).toLocaleString()}
              </div>
            )}
            {hasNewData && onRefresh && (
              <button
                onClick={onRefresh}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Refresh Data
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}