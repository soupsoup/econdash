import { useEffect, useState } from 'react';
import { economicIndicators } from '../data/indicators';

const VISIBLE_KEY = 'visibleCharts';
const KNOWN_KEY = 'knownIndicators';

// Indicators that existed before we started tracking which ones a browser has
// already seen. Anything outside this list counts as new for existing visitors.
const LEGACY_IDS = economicIndicators
  .map(i => i.id)
  .filter(id => !id.endsWith('-mfg') && !['manufacturing-employment', 'core-capital-goods-orders', 'empire-state-manufacturing'].includes(id));

function read<T>(key: string): T | null {
  try {
    const item = window.localStorage.getItem(key);
    return item ? (JSON.parse(item) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable */
  }
}

/**
 * Which indicator cards to show. Visitors keep any cards they have hidden, but
 * indicators added since their last visit are switched on automatically.
 */
export function useVisibleCharts(): [string[], (value: string[]) => void] {
  const [visible, setVisible] = useState<string[]>(() => {
    const allIds = economicIndicators.map(i => i.id);
    const stored = read<string[]>(VISIBLE_KEY);
    if (!stored) return allIds;
    const known = read<string[]>(KNOWN_KEY) ?? LEGACY_IDS;
    const added = allIds.filter(id => !known.includes(id));
    return added.length ? [...stored, ...added] : stored;
  });

  useEffect(() => {
    write(VISIBLE_KEY, visible);
    write(KNOWN_KEY, economicIndicators.map(i => i.id));
  }, [visible]);

  return [visible, setVisible];
}
