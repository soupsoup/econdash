import axios from 'axios';

interface JBNewsEvent {
  name: string;
  currency: string;
  eventID: number;
  category: string;
  date: string;
  actual: string;
  forecast: string;
  previous: string;
  outcome: string;
  strength: string;
  quality: string;
  projection: string;
}

const API_KEY = 'ZLJjlNds.bWLVqZ3bJwWILqD3remPozF9bNV4esFJ';
const BASE_URL = 'https://www.jblanked.com/api/v1';

export async function fetchEconomicCalendar(): Promise<JBNewsEvent[]> {
  try {
    const response = await axios.get<{ calendar_info: JBNewsEvent[] }>(`${BASE_URL}/calendar`, {
      params: {
        api_key: API_KEY,
        today: true
      },
      headers: {
        'Accept': 'application/json'
      }
    });

    // Filter for US events and sort by date
    const events = response.data.calendar_info
      .filter(event => event.currency === 'USD')
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return events;
  } catch (error) {
    console.error('Error fetching JBlanked calendar:', error);
    return [];
  }
} 