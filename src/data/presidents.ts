
import { President } from '../types';

export const presidents: President[] = [
  {
    name: 'George H. W. Bush',
    party: 'Republican',
    term: {
      start: '1989-01-20',
      end: '1993-01-20'
    },
    color: '#CB4335'
  },
  {
    name: 'Bill Clinton',
    party: 'Democratic',
    term: {
      start: '1993-01-20',
      end: '2001-01-20'
    },
    color: '#2471A3'
  },
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
  const currentPresident = presidents.find(president => president.term.end === null);
  return currentPresident || presidents[presidents.length - 1];
};

export const getPresidentByDate = (date: string): President | undefined => {
  const dateObj = new Date(date);
  
  return presidents.find(president => {
    const startDate = new Date(president.term.start);
    const endDate = president.term.end ? new Date(president.term.end) : new Date();
    
    if (date.endsWith('-01-01')) {
      const year = parseInt(date.substring(0, 4));
      const startYear = startDate.getFullYear();
      const endYear = endDate.getFullYear();
      
      if (startDate.getMonth() <= 5) {
        return year >= startYear && year < (president.term.end ? endYear + 1 : new Date().getFullYear() + 1);
      } else {
        return year > startYear && year < (president.term.end ? endYear + 1 : new Date().getFullYear() + 1);
      }
    }
    
    return dateObj >= startDate && dateObj < endDate;
  });
};
