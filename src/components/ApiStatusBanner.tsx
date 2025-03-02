import React from 'react';
import { AlertCircle } from 'lucide-react';

const ApiStatusBanner: React.FC = () => {
  return (
    <div className="bg-red-50 border-b border-red-200 py-2">
      <div className="container mx-auto px-4 flex items-center justify-center">
        <AlertCircle className="h-4 w-4 text-red-600 mr-2" />
        <span className="text-sm text-red-800">
          API data unavailable. Unable to connect to data sources. Please check the error details below.
        </span>
      </div>
    </div>
  );
};

export default ApiStatusBanner;