import React from 'react';
import { useQuery, QueryFunction } from 'react-query';
import { Calendar } from 'lucide-react';
import axios from 'axios';

interface ScheduleEvent {
  date: string;
  time: string | null;
  time_formatted: string | null;
  type: string;
  details: string;
  location: string | null;
  coverage: string | null;
  month: string;
  day: number;
  day_of_week: string;
}

const fetchPresidentSchedule: QueryFunction<ScheduleEvent[]> = async () => {
  try {
    const response = await axios.get<ScheduleEvent[]>('https://media-cdn.factba.se/rss/json/trump/calendar-full.json', {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    
    // Log the response for debugging
    console.log('Schedule API response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching president schedule:', error);
    throw error;
  }
};

const formatDate = (event: ScheduleEvent) => {
  return `${event.day_of_week}, ${event.month} ${event.day}`;
};

const PresidentSchedule: React.FC = () => {
  const { data: scheduleData, isLoading, isError, error } = useQuery<ScheduleEvent[], Error>(
    'presidentSchedule',
    fetchPresidentSchedule,
    {
      refetchOnWindowFocus: false,
      refetchOnMount: true,
      cacheTime: 1000 * 60 * 10, // Cache for 10 minutes
      staleTime: 1000 * 60 * 5, // Consider data stale after 5 minutes
      retry: 3,
      select: (data: ScheduleEvent[]) => {
        // Get today's date in YYYY-MM-DD format
        const today = new Date().toISOString().split('T')[0];
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];
        
        console.log('Filtering for dates:', today, tomorrowStr);
        
        return data
          .filter(event => {
            // Keep events from today and tomorrow
            return event.date === today || event.date === tomorrowStr;
          })
          .sort((a, b) => {
            // First sort by date
            if (a.date !== b.date) {
              return a.date.localeCompare(b.date);
            }
            // Then sort by time if available
            if (a.time && b.time) {
              return a.time.localeCompare(b.time);
            }
            // Put events with no time at the end of their day
            if (!a.time) return 1;
            if (!b.time) return -1;
            return 0;
          });
      }
    }
  );

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-red-600">
          Unable to load President's schedule at this time.
          <br />
          <small>{error?.message}</small>
        </div>
      </div>
    );
  }

  // Group events by date
  const eventsByDate = scheduleData?.reduce((acc, event) => {
    const date = event.date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(event);
    return acc;
  }, {} as Record<string, ScheduleEvent[]>) || {};

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center mb-6">
        <Calendar className="h-6 w-6 text-blue-600 mr-2" />
        <h2 className="text-xl font-semibold">President's Schedule</h2>
      </div>

      {(!scheduleData || scheduleData.length === 0) ? (
        <p className="text-gray-600">No scheduled events for today or tomorrow.</p>
      ) : (
        <div className="space-y-8">
          {Object.entries(eventsByDate).map(([date, events]) => (
            <div key={date} className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700 border-b border-gray-200 pb-2">
                {formatDate(events[0])}
              </h3>
              <div className="space-y-4">
                {events.map((event, index) => (
                  <div 
                    key={`${event.time}-${index}`}
                    className="p-4 bg-gray-50 rounded-lg border border-gray-100"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-semibold text-blue-900">
                        {event.time_formatted || 'All Day'}
                      </span>
                      {event.coverage && (
                        <span className="text-sm text-gray-600 bg-gray-200 px-2 py-1 rounded">
                          {event.coverage}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-800 mb-2">{event.details}</p>
                    {event.location && (
                      <p className="text-sm text-gray-600">
                        Location: {event.location}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PresidentSchedule; 