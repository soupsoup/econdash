import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ErrorDisplayProps {
  title?: string;
  message: string;
  details?: string;
  onRetry?: () => void;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ 
  title = "Error Loading Data", 
  message, 
  details, 
  onRetry 
}) => {
  return (
    <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4 flex items-start">
      <AlertTriangle className="h-5 w-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" />
      <div className="flex-1">
        <p className="font-medium">{title}</p>
        <p className="text-sm mt-1">{message}</p>
        
        {details && (
          <>
            <p className="text-sm mt-2 font-medium">Error details:</p>
            <div className="text-sm text-red-700 font-mono bg-red-50 p-2 rounded mt-1 border border-red-200 overflow-auto max-h-32">
              {details}
            </div>
          </>
        )}
        
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-3 bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded text-sm transition-colors"
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorDisplay;