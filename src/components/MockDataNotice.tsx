import React, { useState } from 'react';
import { AlertCircle, X, ExternalLink } from 'lucide-react';

interface ApiErrorNoticeProps {
  errors?: Record<string, string>;
}

const ApiErrorNotice: React.FC<ApiErrorNoticeProps> = ({ errors = {} }) => {
  const [expanded, setExpanded] = useState(false);
  const errorCount = Object.keys(errors).length;
  
  return (
    <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4 mb-6 relative">
      <button 
        onClick={() => setExpanded(false)} 
        className={`absolute top-2 right-2 text-red-600 hover:text-red-800 ${!expanded && 'hidden'}`}
      >
        <X className="h-4 w-4" />
      </button>
      
      <div className="flex items-start">
        <AlertCircle className="h-5 w-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <div className="flex justify-between items-center">
            <p className="font-medium">
              API Data Unavailable
            </p>
            {!expanded && (
              <button 
                onClick={() => setExpanded(true)} 
                className="text-sm text-red-700 hover:text-red-900 underline ml-2"
              >
                View error details
              </button>
            )}
          </div>
          
          {expanded ? (
            <>
              <p className="text-sm mt-2">
                We're experiencing technical difficulties retrieving the economic data:
              </p>
              
              <div className="mt-3 bg-red-100 p-3 rounded-md border border-red-200">
                <p className="text-sm font-medium mb-1">Status:</p>
                
                {errorCount > 0 ? (
                  <div className="space-y-3">
                    {Object.entries(errors).map(([source, message]) => (
                      <div key={source} className="text-sm">
                        <p className="font-medium">{source}</p>
                        <p className="text-xs bg-red-50 p-2 rounded border border-red-200 mt-1">
                          Service temporarily unavailable
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm">Service temporarily unavailable.</p>
                )}
                
                <p className="text-sm font-medium mt-3 mb-1">Troubleshooting steps:</p>
                <ul className="text-sm list-disc list-inside ml-2">
                  <li>Check your internet connection</li>
                  <li>Try refreshing the page</li>
                  <li>Clear your browser cache</li>
                  <li>Try again later</li>
                </ul>
                
                <div className="mt-3 flex items-center">
                  <a 
                    href="https://fred.stlouisfed.org/docs/api/fred/"
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-red-800 hover:text-red-900 flex items-center"
                  >
                    <span>Learn more about our data sources</span>
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm">
              Failed to retrieve data from FRED API. Click "View error details" to see the specific errors.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ApiErrorNotice;