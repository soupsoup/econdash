import React from 'react';
import { Link } from 'react-router-dom';
import { IndicatorData, IndicatorDataPoint } from '../types';
import { presidents } from '../data/presidents';

// Indicators shown on the front page; the dashboard hides these from its card grid.
export const FRONT_PAGE_IDS = [
  'unemployment',
  'job-creation',
  'gas-prices',
  'crude-oil',
  'mortgage-30yr',
  'stock-market',
  'industrial-production-mfg',
  'capacity-utilization-mfg',
  'manufacturing-employment',
  'core-capital-goods-orders',
  'empire-state-manufacturing',
];

interface Reading {
  indicator: IndicatorData['indicator'];
  latest: IndicatorDataPoint;
  yearAgo?: IndicatorDataPoint;
}

const time = (d: string) => new Date(d + 'T00:00:00').getTime();
const monthYear = (d: string) =>
  new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

function read(all: IndicatorData[], id: string): Reading | null {
  const item = all.find(d => d.indicator?.id === id);
  if (!item || !item.data) return null;
  const asc = item.data
    .filter(p => p && Number.isFinite(p.value) && p.date)
    .sort((a, b) => time(a.date) - time(b.date));
  if (asc.length === 0) return null;
  const latest = asc[asc.length - 1];
  const target = new Date(latest.date + 'T00:00:00');
  target.setFullYear(target.getFullYear() - 1);
  let yearAgo: IndicatorDataPoint | undefined;
  let best = 45 * 86400000; // must be within ~45 days of one year earlier
  for (const p of asc) {
    const diff = Math.abs(time(p.date) - target.getTime());
    if (diff < best) {
      best = diff;
      yearAgo = p;
    }
  }
  return { indicator: item.indicator, latest, yearAgo };
}

type Verdict = 'better' | 'worse' | 'flat';
function verdict(r: Reading): Verdict | null {
  if (!r.yearAgo) return null;
  const d = r.latest.value - r.yearAgo.value;
  if (Math.abs(d) < 1e-9) return 'flat';
  return d > 0 === r.indicator.higherIsBetter ? 'better' : 'worse';
}

// ---------- Scoreboard tiles ----------

const TILES: { id: string; label: string; fmt: (v: number) => string }[] = [
  { id: 'unemployment', label: 'Unemployment', fmt: v => `${v.toFixed(1)}%` },
  { id: 'job-creation', label: 'Jobs', fmt: v => `${(v / 1000).toFixed(1)}M` },
  { id: 'gas-prices', label: 'Gas', fmt: v => `$${v.toFixed(2)}` },
  { id: 'mortgage-30yr', label: 'Mortgage rate', fmt: v => `${v.toFixed(2)}%` },
  { id: 'stock-market', label: 'S&P 500', fmt: v => Math.round(v).toLocaleString() },
  { id: 'crude-oil', label: 'Crude oil', fmt: v => `$${v.toFixed(2)}` },
];

const TILE_STYLE: Record<Verdict, { box: string; badge: string; word: string }> = {
  better: { box: 'bg-ink text-paper', badge: 'bg-paper text-ink', word: 'Better' },
  worse: { box: 'bg-flag text-white', badge: 'bg-white text-[#8A0F20]', word: 'Worse' },
  flat: { box: 'border-2 border-ink text-ink', badge: 'bg-ink text-paper', word: 'Flat' },
};

function Tiles({ all }: { all: IndicatorData[] }) {
  const tiles = TILES.map(t => ({ t, r: read(all, t.id) })).filter(x => x.r) as { t: typeof TILES[number]; r: Reading }[];
  if (tiles.length === 0) return null;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {tiles.map(({ t, r }) => {
        const v = verdict(r);
        const style = v ? TILE_STYLE[v] : TILE_STYLE.flat;
        return (
          <Link
            key={t.id}
            to={`/indicator/${t.id}`}
            className={`block p-5 hover:text-inherit hover:brightness-95 ${style.box}`}
          >
            <div className="flex items-center justify-between gap-2 font-display font-bold text-lg tracking-[0.08em]">
              <span>{t.label}</span>
              {v && <span className={`px-2.5 py-0.5 text-sm ${style.badge}`}>{style.word}</span>}
            </div>
            <div className="mt-2 font-display font-extrabold text-6xl sm:text-7xl leading-none">{t.fmt(r.latest.value)}</div>
            {r.yearAgo && (
              <div className="mt-1 text-base font-medium">
                Was {t.fmt(r.yearAgo.value)} in {monthYear(r.yearAgo.date)}
              </div>
            )}
          </Link>
        );
      })}
    </div>
  );
}

// ---------- Manufacturing ("Made in America") ----------

const MFG: { id: string; label: string; fmt: (v: number) => string }[] = [
  { id: 'industrial-production-mfg', label: 'Production', fmt: v => v.toFixed(1) },
  { id: 'capacity-utilization-mfg', label: 'Capacity used', fmt: v => `${v.toFixed(1)}%` },
  { id: 'manufacturing-employment', label: 'Factory jobs', fmt: v => `${(v / 1000).toFixed(2)}M` },
  { id: 'core-capital-goods-orders', label: 'Capital orders', fmt: v => `$${(v / 1000).toFixed(1)}B` },
  { id: 'empire-state-manufacturing', label: 'Empire State', fmt: v => v.toFixed(1) },
];
const NUMBER_WORDS = ['no', 'one', 'two', 'three', 'four', 'five'];

function Manufacturing({ all }: { all: IndicatorData[] }) {
  const cells = MFG.map(m => ({ m, r: read(all, m.id) })).filter(x => x.r) as { m: typeof MFG[number]; r: Reading }[];
  if (cells.length === 0) return null;
  const withYear = cells.filter(c => c.r.yearAgo);
  const up = withYear.filter(c => c.r.latest.value > (c.r.yearAgo as IndicatorDataPoint).value).length;
  const summary =
    withYear.length === 0
      ? 'Manufacturing'
      : up === withYear.length
        ? `Manufacturing, all ${NUMBER_WORDS[up] ?? up} up on the year`
        : `Manufacturing, ${up} of ${withYear.length} up on the year`;
  return (
    <section className="mt-14">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b-[3px] border-ink pb-2">
        <h2 className="section-title !text-5xl sm:!text-6xl">Made in America</h2>
        <span className="font-display font-bold text-lg tracking-[0.12em] uppercase text-accent">{summary}</span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        {cells.map(({ m, r }) => (
          <Link
            key={m.id}
            to={`/indicator/${m.id}`}
            className="flex flex-col px-5 first:pl-0 py-6 border-r border-b lg:border-b-0 border-rule last:border-r-0 hover:text-inherit hover:bg-white/5"
          >
            <div className="eyebrow !text-base flex-1">{m.label}</div>
            <div className="mt-1 font-display font-extrabold text-6xl leading-none">{m.fmt(r.latest.value)}</div>
            {r.yearAgo && <div className="mt-1 text-base text-ink-soft">Was {m.fmt(r.yearAgo.value)}</div>}
          </Link>
        ))}
      </div>
    </section>
  );
}

export default function FrontPage({ indicators }: { indicators: IndicatorData[] }) {
  const month = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  return (
    <>
      <section className="pt-4 pb-10">
        <div className="font-display font-bold text-xl tracking-[0.14em] uppercase text-accent">{month} report card</div>
        <h1 className="mt-2 font-display font-extrabold text-7xl sm:text-9xl leading-[0.9] tracking-tight max-w-4xl">
          Is it getting better?
        </h1>
        <p className="mt-6 max-w-2xl text-xl leading-snug text-ink-soft">
          Every indicator, compared with a year ago. No spin, just the direction of travel.
        </p>
      </section>

      <Tiles all={indicators} />
      <Manufacturing all={indicators} />

      <section className="mt-12 bg-ink text-paper px-7 py-6 flex flex-wrap items-center justify-between gap-5">
        <div className="font-display font-extrabold text-4xl sm:text-5xl leading-none">Compare administrations</div>
        <div className="flex flex-wrap items-center gap-2 font-display font-bold text-lg tracking-[0.06em] uppercase">
          {presidents.map(p => (
            <span key={`${p.name}-${p.term.start}`} className="border-2 border-paper px-3 py-1">
              {p.name.split(' ').slice(-1)[0]}
            </span>
          ))}
          <a href="#presidential-comparison" className="bg-flag border-2 border-flag text-white px-4 py-1 hover:text-white hover:brightness-110">
            Compare →
          </a>
        </div>
      </section>

      <p className="mt-4 text-sm text-ink-soft">
        Better and Worse judge each move by whether it is generally good for households. Comparisons are to the same period a year earlier.
      </p>
    </>
  );
}
