import React, { useState } from 'react';
import { AlertCircle, X, ExternalLink } from 'lucide-react';

interface ApiErrorNoticeProps {
  errors?: Record<string, string>;
}

const ApiErrorNotice: React.FC<ApiErrorNoticeProps> = ({ errors = {} }) => {
  const [expanded, setExpanded] = useState(false);
  const errorCount = Object.keys(errors).length;
  
  return (
    <div className="border-y-2 border-accent text-accent py-4 mb-6 relative">
      <button 
        onClick={() => setExpanded(false)} 
        className={`absolute top-2 right-2 text-accent hover:text-ink ${!expanded && 'hidden'}`}
      >
        <X className="h-4 w-4" />
      </button>
      
      <div className="flex items-start">
        <AlertCircle className="h-5 w-5 text-accent mr-3 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <div className="flex justify-between items-center">
            <p className="font-medium">
              API Data Unavailable
            </p>
            {!expanded && (
              <button 
                onClick={() => setExpanded(true)} 
                className="font-mono text-sm uppercase tracking-wide underline ml-2"
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
              
              <div className="mt-3 p-3 border border-accent/40">
                <p className="text-sm font-medium mb-1">Status:</p>
                
                {errorCount > 0 ? (
                  <div className="space-y-3">
                    {Object.entries(errors).map(([source, message]) => (
                      <div key={source} className="text-sm">
                        <p className="font-medium">{source}</p>
                        <p className="text-xs p-2 border border-accent/30 mt-1">
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
                    className="text-sm hover:text-ink flex items-center"
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