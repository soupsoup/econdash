import React from 'react';
import { Calendar } from 'lucide-react';

const EconomicCalendar: React.FC = () => {
  return (
    <div className="bg-white rounded-lg shadow-md w-full">
      <div className="p-4">
        <div className="flex items-center mb-4">
          <Calendar className="h-6 w-6 text-blue-600 mr-2" />
          <h2 className="text-xl font-semibold">Economic Calendar</h2>
        </div>
        
        <div className="relative" style={{ height: '600px' }}>
          <iframe 
            src="https://sslecal2.investing.com?columns=exc_flags,exc_currency,exc_importance,exc_actual,exc_forecast,exc_previous&features=datepicker,timezone&countries=25,32,6,37,72,22,17,39,14,10,35,43,56,36,110,11,26,12,4,5&calType=week&timeZone=8&lang=1"
            width="100%" 
            height="100%" 
            frameBorder="0" 
            allowTransparency={true}
            className="absolute inset-0"
          ></iframe>
        </div>
      </div>
    </div>
  );
};

export default EconomicCalendar; 