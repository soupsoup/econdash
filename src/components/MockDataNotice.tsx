import React, { useState } from 'react';
import { AlertCircle, X, ExternalLink } from 'lucide-react';

interface ApiErrorNoticeProps {
  errors?: Record<string, string>;
}

const ApiErrorNotice: React.FC<ApiErrorNoticeProps> = ({ errors = {} }) => {
  const [expanded, setExpanded] = useState(false);
  const errorCount = Object.keys(errors).length;
  
  // Check if BLS rate limit error is present
  const hasRateLimitError = Object.values(errors).some(
    error => error.includes('threshold') || error.includes('rate limit')
  );
  
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
              {hasRateLimitError 
                ? "BLS API Daily Request Limit Reached" 
                : "API Data Unavailable"}
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
                {hasRateLimitError 
                  ? "The Bureau of Labor Statistics (BLS) API has a daily request limit that has been reached. This is a common limitation of free API keys."
                  : "We couldn't retrieve the economic data from the following API sources:"}
              </p>
              
              <div className="mt-3 bg-red-100 p-3 rounded-md border border-red-200">
                <p className="text-sm font-medium mb-1">Error details:</p>
                
                {errorCount > 0 ? (
                  <div className="space-y-3">
                    {Object.entries(errors).map(([source, message]) => (
                      <div key={source} className="text-sm">
                        <p className="font-medium">{source}:</p>
                        <p className="font-mono text-xs bg-red-50 p-2 rounded border border-red-200 mt-1 overflow-auto max-h-48">
                          {message}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm">No specific error details available.</p>
                )}
                
                {hasRateLimitError && (
                  <>
                    <p className="text-sm font-medium mt-3 mb-1">About BLS API Rate Limits:</p>
                    <ul className="text-sm list-disc list-inside ml-2">
                      <li>Free API keys are limited to 500 requests per day</li>
                      <li>Rate limits reset at midnight Eastern Time</li>
                      <li>Consider registering for a new API key if you need more requests</li>
                      <li>The application will use locally stored data when available</li>
                    </ul>
                  </>
                )}
                
                <p className="text-sm font-medium mt-3 mb-1">Other common API issues:</p>
                <ul className="text-sm list-disc list-inside ml-2">
                  <li>CORS restrictions in browser environment</li>
                  <li>Network connectivity problems</li>
                  <li>API service timeouts</li>
                </ul>
                
                <div className="mt-3 flex items-center">
                  <a 
                    href="https://www.bls.gov/developers/api_faqs.htm#register1" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-red-800 hover:text-red-900 flex items-center"
                  >
                    <span>Learn more about BLS API limits</span>
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm">
              {hasRateLimitError 
                ? "The BLS API has a daily limit of 500 requests which has been reached. The application will use locally stored data when available."
                : "Failed to retrieve data from API sources. Click \"View error details\" to see the specific errors."}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ApiErrorNotice;