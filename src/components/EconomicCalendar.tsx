import React from 'react';
import { useQuery } from 'react-query';
import { Calendar, TrendingUp, TrendingDown } from 'lucide-react';
import { fetchEconomicCalendar } from '../services/jblanked-api';

const EconomicCalendar: React.FC = () => {
  const { data: events, isLoading, isError } = useQuery(
    'economic-calendar',
    fetchEconomicCalendar,
    {
      refetchInterval: 1000 * 60 * 5, // Refetch every 5 minutes (free tier limit)
      staleTime: 1000 * 60 * 4, // Consider data stale after 4 minutes
    }
  );

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
        <div className="flex items-center mb-4">
          <div className="w-5 h-5 bg-gray-200 rounded mr-2"></div>
          <div className="h-6 bg-gray-200 rounded w-48"></div>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-100 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-red-500 text-center">
          Unable to load economic calendar data.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold text-gray-800 flex items-center mb-4">
        <Calendar className="h-5 w-5 mr-2 text-blue-600" />
        Today's Economic Events
      </h2>

      {events && events.length > 0 ? (
        <div className="space-y-4">
          {events.map((event) => {
            const isPositive = event.outcome === 'Better' || event.outcome === 'Good';
            const isNegative = event.outcome === 'Worse' || event.outcome === 'Bad';
            
            return (
              <div
                key={event.eventID}
                className={`border-l-4 pl-4 py-2 ${
                  isPositive ? 'border-green-500' :
                  isNegative ? 'border-red-500' :
                  'border-blue-500'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-gray-900">{event.name}</h3>
                    <p className="text-sm text-gray-500">
                      {new Date(event.date).toLocaleDateString(undefined, {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        event.strength === 'High' ? 'bg-red-100 text-red-700' :
                        event.strength === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {event.strength} Impact
                      </span>
                      {event.outcome && (
                        <span className={`text-xs px-2 py-0.5 rounded flex items-center ${
                          isPositive ? 'bg-green-100 text-green-700' :
                          isNegative ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {isPositive && <TrendingUp className="h-3 w-3 mr-1" />}
                          {isNegative && <TrendingDown className="h-3 w-3 mr-1" />}
                          {event.outcome}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      Previous: {event.previous}
                    </div>
                    {event.forecast && (
                      <div className="text-sm text-gray-500">
                        Forecast: {event.forecast}
                      </div>
                    )}
                    {event.actual && (
                      <div className={`text-sm font-semibold ${
                        isPositive ? 'text-green-600' :
                        isNegative ? 'text-red-600' :
                        'text-gray-600'
                      }`}>
                        Actual: {event.actual}
                      </div>
                    )}
                    {event.projection && (
                      <div className="text-xs text-gray-500 mt-1">
                        Projection: {event.projection}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center text-gray-500 py-4">
          No economic events scheduled for today.
        </div>
      )}
    </div>
  );
};

export default EconomicCalendar; 