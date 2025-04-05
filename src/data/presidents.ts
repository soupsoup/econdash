
import { President } from '../types';

export const presidents: President[] = [
  {
    name: 'George W. Bush',
    party: 'Republican',
    term: {
      start: '2001-01-20',
      end: '2009-01-20'
    },
    color: '#CB4335'
  },
  {
    name: 'Barack Obama',
    party: 'Democratic',
    term: {
      start: '2009-01-20',
      end: '2017-01-20'
    },
    color: '#2471A3'
  },
  {
    name: 'Donald J. Trump',
    party: 'Republican',
    term: {
      start: '2017-01-20',
      end: '2021-01-20'
    },
    color: '#E74C3C'
  },
  {
    name: 'Joe Biden',
    party: 'Democratic',
    term: {
      start: '2021-01-20',
      end: '2025-01-20'
    },
    color: '#1A5276'
  },
  {
    name: 'Donald J. Trump',
    party: 'Republican',
    term: {
      start: '2025-01-20',
      end: null
    },
    color: '#E74C3C'
  }
];

export const getCurrentPresident = (): President => {
  // Find the president with no end date (current president)
  const currentPresident = presidents.find(president => president.term.end === null);
  return currentPresident || presidents[presidents.length - 1];
};

export const getPresidentByDate = (date: string): President | undefined => {
  const dateObj = new Date(date);
  
  // Ensure we're comparing with the correct precision
  // For annual data (like median income), we need to be careful with the date comparison
  return presidents.find(president => {
    const startDate = new Date(president.term.start);
    const endDate = president.term.end ? new Date(president.term.end) : new Date();
    
    // For annual data that might only have the year (like "2015-01-01"),
    // we need to be more precise about which president was in office
    if (date.endsWith('-01-01')) {
      const year = parseInt(date.substring(0, 4));
      const startYear = startDate.getFullYear();
      const endYear = endDate.getFullYear();
      
      // If the date is January 1st, we need to check if the president was in office for most of that year
      // For transition years, assign the year to the president who served most of it
      if (startDate.getMonth() <= 5) { // If term started before June
        return year >= startYear && year < (president.term.end ? endYear + 1 : new Date().getFullYear() + 1);
      } else {
        // If term started after June, don't count the first year
        return year > startYear && year < (president.term.end ? endYear + 1 : new Date().getFullYear() + 1);
      }
    }
    
    // For more precise dates, use the exact date comparison
    return dateObj >= startDate && dateObj < endDate;
  });
};
