import React from 'react';
import { Link } from 'react-router-dom';
import { IndicatorData, IndicatorDataPoint } from '../types';

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
  prev?: IndicatorDataPoint;
  yearAgo?: IndicatorDataPoint;
  asc: IndicatorDataPoint[];
}

const time = (d: string) => new Date(d + 'T00:00:00').getTime();
const monthName = (d: string) =>
  new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'long' });

function read(all: IndicatorData[], id: string): Reading | null {
  const item = all.find(d => d.indicator?.id === id);
  if (!item || !item.data) return null;
  const asc = item.data
    .filter(p => p && Number.isFinite(p.value) && p.date)
    .sort((a, b) => time(a.date) - time(b.date));
  if (asc.length === 0) return null;
  const latest = asc[asc.length - 1];
  const prev = asc.length > 1 ? asc[asc.length - 2] : undefined;
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
  return { indicator: item.indicator, latest, prev, yearAgo, asc };
}

const change = (r: Reading) => (r.prev ? r.latest.value - r.prev.value : 0);
const tone = (r: Reading, delta: number) =>
  delta === 0 ? 'text-ink-soft' : (delta > 0) === r.indicator.higherIsBetter ? 'text-good' : 'text-accent';
const arrow = (delta: number) => (delta > 0 ? '▲' : delta < 0 ? '▼' : '–');

function Arrow({ r }: { r: Reading }) {
  const d = change(r);
  return <span className={tone(r, d)} aria-label={d > 0 ? 'up' : d < 0 ? 'down' : 'unchanged'}>{arrow(d)}</span>;
}

// ---------- Lead story ----------

function LeadChart({ r }: { r: Reading }) {
  const pts = r.asc.slice(-36);
  if (pts.length < 2) return null;
  const W = 420, H = 130, pad = 8;
  const vals = pts.map(p => p.value);
  const min = Math.min(...vals), max = Math.max(...vals);
  const span = max - min || 1;
  const x = (i: number) => (i / (pts.length - 1)) * W;
  const y = (v: number) => pad + (1 - (v - min) / span) * (H - 2 * pad - 10);
  const line = pts.map((p, i) => `${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(' ');
  const last = pts[pts.length - 1];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="flex-1 min-w-[240px] max-w-full" role="img"
      aria-label={`${r.indicator.name}, last ${pts.length} readings`}>
      <line x1="0" y1={H - 4} x2={W} y2={H - 4} stroke="#1A1814" strokeWidth="1" />
      <line x1="0" y1={y((min + max) / 2)} x2={W} y2={y((min + max) / 2)} stroke="#C9C1AE" strokeDasharray="3 4" />
      <polyline points={line} fill="none" stroke="#1A1814" strokeWidth="2.5" />
      <circle cx={x(pts.length - 1)} cy={y(last.value)} r="5" fill="#B3261E" />
    </svg>
  );
}

function LeadStory({ all }: { all: IndicatorData[] }) {
  const u = read(all, 'unemployment');
  const jobs = read(all, 'job-creation');
  if (!u) return null;
  const v = u.latest.value;
  const ya = u.yearAgo?.value;
  let headline = `Unemployment is ${v.toFixed(1)}%`;
  if (ya !== undefined) {
    if (v < ya) headline = `Unemployment eases to ${v.toFixed(1)}%, down from ${ya.toFixed(1)}% a year ago`;
    else if (v > ya) headline = `Unemployment rises to ${v.toFixed(1)}%, up from ${ya.toFixed(1)}% a year ago`;
    else headline = `Unemployment holds at ${v.toFixed(1)}%, unchanged from a year ago`;
  }
  const sentences: string[] = [];
  if (jobs && jobs.prev) {
    const d = jobs.latest.value - jobs.prev.value; // thousands of jobs
    sentences.push(
      `Nonfarm payrolls reached ${(jobs.latest.value / 1000).toFixed(1)} million, ${d >= 0 ? 'up' : 'down'} ${Math.abs(Math.round(d * 1000)).toLocaleString()} from ${monthName(jobs.prev.date)}.`
    );
  }
  if (u.prev) {
    const d = v - u.prev.value;
    sentences.push(
      d === 0
        ? `The jobless rate is unchanged from ${monthName(u.prev.date)}.`
        : `The jobless rate ${d < 0 ? 'fell' : 'rose'} from ${u.prev.value.toFixed(1)}% in ${monthName(u.prev.date)}.`
    );
  }
  return (
    <article className="flex-[2_1_620px] min-w-0 lg:pr-10 lg:border-r border-rule">
      <div className="eyebrow !text-accent">Jobs · {monthName(u.latest.date)} data</div>
      <h2 className="mt-2 font-display font-extrabold text-4xl sm:text-5xl leading-[1.05] tracking-tight">
        <Link to="/indicator/unemployment" className="hover:text-ink">{headline}</Link>
      </h2>
      {sentences.length > 0 && (
        <p className="mt-4 text-xl leading-relaxed text-ink-soft">{sentences.join(' ')}</p>
      )}
      <div className="mt-6 flex flex-wrap items-end gap-7">
        <div className="font-display font-extrabold text-8xl sm:text-9xl leading-[.9] text-accent">
          {v.toFixed(1)}<span className="text-5xl sm:text-6xl">%</span>
        </div>
        <LeadChart r={u} />
      </div>
      <div className="mt-2 font-mono text-[11px] text-ink-soft">
        Source: BLS via FRED, series {u.indicator.seriesId}. Latest reading {monthName(u.latest.date)} {u.latest.date.slice(0, 4)}.
      </div>
    </article>
  );
}

// ---------- By the numbers ----------

const SIDEBAR: { id: string; label: string; fmt: (v: number) => string }[] = [
  { id: 'gas-prices', label: 'Gas, regular', fmt: v => `$${v.toFixed(2)}` },
  { id: 'crude-oil', label: 'Crude oil (WTI)', fmt: v => `$${v.toFixed(2)}` },
  { id: 'mortgage-30yr', label: '30-year mortgage', fmt: v => `${v.toFixed(2)}%` },
  { id: 'stock-market', label: 'S&P 500', fmt: v => v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) },
  { id: 'job-creation', label: 'Payrolls', fmt: v => `${(v / 1000).toFixed(1)}M` },
];

function ByTheNumbers({ all }: { all: IndicatorData[] }) {
  const rows = SIDEBAR.map(s => ({ s, r: read(all, s.id) })).filter(x => x.r) as { s: typeof SIDEBAR[number]; r: Reading }[];
  if (rows.length === 0) return null;
  return (
    <aside className="flex-[1_1_300px] min-w-0">
      <div className="font-display font-extrabold text-2xl border-b-2 border-ink pb-2">By the numbers</div>
      <div className="text-lg">
        {rows.map(({ s, r }) => (
          <Link key={s.id} to={`/indicator/${s.id}`}
            className="flex justify-between gap-3 py-3 border-b border-rule hover:text-ink hover:bg-black/5">
            <span>{s.label}</span>
            <span className="font-mono">{s.fmt(r.latest.value)} <Arrow r={r} /></span>
          </Link>
        ))}
      </div>
    </aside>
  );
}

// ---------- Manufacturing strip ----------

const MFG: { id: string; label: string; value: (v: number) => string; delta: (d: number) => string }[] = [
  { id: 'industrial-production-mfg', label: 'Industrial production', value: v => v.toFixed(1), delta: d => Math.abs(d).toFixed(1) },
  { id: 'capacity-utilization-mfg', label: 'Capacity utilization', value: v => `${v.toFixed(1)}%`, delta: d => `${Math.abs(d).toFixed(1)} pt` },
  { id: 'manufacturing-employment', label: 'Factory jobs', value: v => `${(v / 1000).toFixed(2)}M`, delta: d => Math.abs(Math.round(d * 1000)).toLocaleString() },
  { id: 'core-capital-goods-orders', label: 'Core capital goods orders', value: v => `$${(v / 1000).toFixed(1)}B`, delta: d => `$${Math.abs(d / 1000).toFixed(1)}B` },
  { id: 'empire-state-manufacturing', label: 'Empire State survey', value: v => v.toFixed(1), delta: d => Math.abs(d).toFixed(1) },
];

function ManufacturingStrip({ all }: { all: IndicatorData[] }) {
  const cells = MFG.map(m => ({ m, r: read(all, m.id) })).filter(x => x.r) as { m: typeof MFG[number]; r: Reading }[];
  if (cells.length === 0) return null;
  return (
    <section className="mt-12 border-t-4 border-double border-ink pt-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="section-title !text-4xl">Manufacturing</h2>
        <Link to="/indicator/industrial-production-mfg" className="eyebrow border-b border-ink">All manufacturing data →</Link>
      </div>
      <div className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 border-t border-ink">
        {cells.map(({ m, r }) => {
          const d = change(r);
          return (
            <Link key={m.id} to={`/indicator/${m.id}`}
              className="px-4 first:pl-0 py-5 border-b border-ink border-r last:border-r-0 border-r-rule hover:bg-black/5">
              <div className="eyebrow !text-[11px]">{m.label}</div>
              <div className="mt-1.5 font-display font-extrabold text-4xl sm:text-5xl tracking-tight">{m.value(r.latest.value)}</div>
              {r.prev && (
                <div className={`text-[15px] ${tone(r, d)}`}>
                  {arrow(d)} {m.delta(d)} from {monthName(r.prev.date)}
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export default function FrontPage({ indicators }: { indicators: IndicatorData[] }) {
  return (
    <>
      <div className="flex flex-wrap gap-10">
        <LeadStory all={indicators} />
        <ByTheNumbers all={indicators} />
      </div>
      <ManufacturingStrip all={indicators} />
    </>
  );
}
