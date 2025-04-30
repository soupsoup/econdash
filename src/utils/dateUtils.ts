import { EconomicIndicator } from '../types';

interface DailySchedule {
  hour: number;
  minute: number;
}

interface WeeklySchedule {
  day: number;
  hour: number;
  minute: number;
}

interface MonthlySchedule {
  day: number;
  hour: number;
  minute: number;
}

interface QuarterlySchedule {
  month: number[];
  day: number;
  hour: number;
  minute: number;
}

interface YearlySchedule {
  month: number;
  day: number;
  hour: number;
  minute: number;
}

interface ReleaseSchedules {
  monthly: {
    [key: string]: MonthlySchedule;
  };
  quarterly: {
    [key: string]: QuarterlySchedule;
  };
  weekly: {
    [key: string]: WeeklySchedule;
  };
  yearly: {
    [key: string]: YearlySchedule;
  };
  daily: {
    [key: string]: DailySchedule;
  };
}

// Release schedules based on typical government data release patterns
const RELEASE_SCHEDULES: ReleaseSchedules = {
  monthly: {
    // Most monthly economic data is released around the 15th of the following month
    unemployment: { day: 1, hour: 8, minute: 30 }, // First Friday, 8:30 AM ET
    'monthly-inflation': { day: 10, hour: 8, minute: 30 }, // Around 10th, 8:30 AM ET
    'job-creation': { day: 1, hour: 8, minute: 30 }, // First Friday, 8:30 AM ET
    cpi: { day: 10, hour: 8, minute: 30 }, // Around 10th, 8:30 AM ET
    default: { day: 15, hour: 8, minute: 30 }
  },
  quarterly: {
    'gdp-growth': { month: [1, 4, 7, 10], day: 30, hour: 8, minute: 30 }, // End of month following quarter
    'federal-debt': { month: [1, 4, 7, 10], day: 15, hour: 10, minute: 0 },
    default: { month: [1, 4, 7, 10], day: 30, hour: 8, minute: 30 }
  },
  weekly: {
    'gas-prices': { day: 1, hour: 10, minute: 30 }, // Monday, 10:30 AM ET
    'mortgage-30yr': { day: 4, hour: 10, minute: 0 }, // Thursday, 10:00 AM ET
    default: { day: 1, hour: 10, minute: 30 }
  },
  yearly: {
    'median-income': { month: 9, day: 15, hour: 10, minute: 0 }, // Mid-September
    default: { month: 12, day: 31, hour: 10, minute: 0 }
  },
  daily: {
    'stock-market': { hour: 16, minute: 0 }, // 4:00 PM ET (market close)
    default: { hour: 17, minute: 0 }
  }
};

export function getNextUpdateDate(indicator: EconomicIndicator): Date {
  const now = new Date();
  const schedule = RELEASE_SCHEDULES[indicator.frequency as keyof typeof RELEASE_SCHEDULES];
  const specificSchedule = schedule[indicator.id as keyof typeof schedule] || schedule.default;
  
  let nextUpdate = new Date();
  
  switch (indicator.frequency) {
    case 'monthly': {
      const monthlySchedule = specificSchedule as MonthlySchedule;
      // Move to next month
      nextUpdate.setMonth(now.getMonth() + 1);
      nextUpdate.setDate(monthlySchedule.day);
      nextUpdate.setHours(monthlySchedule.hour, monthlySchedule.minute, 0, 0);
      
      // If we're past this month's release, move to next month
      if (now > nextUpdate) {
        nextUpdate.setMonth(nextUpdate.getMonth() + 1);
      }
      break;
    }
      
    case 'quarterly': {
      const quarterlySchedule = specificSchedule as QuarterlySchedule;
      const quarterMonths = quarterlySchedule.month;
      let nextMonth = quarterMonths.find(month => 
        month > now.getMonth() + 1
      ) || quarterMonths[0];
      
      nextUpdate.setMonth(nextMonth - 1);
      nextUpdate.setDate(quarterlySchedule.day);
      nextUpdate.setHours(quarterlySchedule.hour, quarterlySchedule.minute, 0, 0);
      
      if (nextMonth <= now.getMonth() + 1) {
        nextUpdate.setFullYear(now.getFullYear() + 1);
      }
      break;
    }
      
    case 'weekly': {
      const weeklySchedule = specificSchedule as WeeklySchedule;
      // Move to next occurrence of the specified day (1 = Monday)
      const dayOfWeek = weeklySchedule.day;
      const daysUntilNext = (dayOfWeek - now.getDay() + 7) % 7;
      nextUpdate.setDate(now.getDate() + daysUntilNext);
      nextUpdate.setHours(weeklySchedule.hour, weeklySchedule.minute, 0, 0);
      
      if (now > nextUpdate) {
        nextUpdate.setDate(nextUpdate.getDate() + 7);
      }
      break;
    }
      
    case 'yearly': {
      const yearlySchedule = specificSchedule as YearlySchedule;
      nextUpdate.setMonth(yearlySchedule.month - 1);
      nextUpdate.setDate(yearlySchedule.day);
      nextUpdate.setHours(yearlySchedule.hour, yearlySchedule.minute, 0, 0);
      
      if (now > nextUpdate) {
        nextUpdate.setFullYear(nextUpdate.getFullYear() + 1);
      }
      break;
    }
      
    case 'daily': {
      const dailySchedule = specificSchedule as DailySchedule;
      nextUpdate.setHours(dailySchedule.hour, dailySchedule.minute, 0, 0);
      
      if (now > nextUpdate) {
        nextUpdate.setDate(nextUpdate.getDate() + 1);
      }
      break;
    }
  }
  
  return nextUpdate;
}

export function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    timeZone: 'America/New_York',
    timeZoneName: 'short'
  }).format(date);
} 