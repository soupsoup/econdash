import React from 'react';
import { Link } from 'react-router-dom';

interface HeaderProps {
  lastUpdated?: string | null;
  hasNewData?: boolean;
  onRefresh?: () => void;
}

const NAV = [
  { to: '/', label: 'Dashboard' },
  { to: '/indicator/industrial-production-mfg', label: 'Manufacturing' },
  { to: '/posts', label: 'Updates' },
  { to: '/wire', label: 'Wire' },
];

export default function Header({ lastUpdated, hasNewData, onRefresh }: HeaderProps) {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <header className="bg-paper text-ink">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex flex-wrap justify-between gap-x-6 gap-y-1 py-3 border-b border-ink eyebrow">
          <span>{today}</span>
          <span className="hidden sm:inline">Sources: FRED · BLS · BEA · Census</span>
          <span>
            {lastUpdated ? `Updated ${new Date(lastUpdated).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}` : 'Updated daily'}
            {hasNewData && onRefresh && (
              <button onClick={onRefresh} className="ml-3 underline text-accent normal-case tracking-normal">
                Refresh
              </button>
            )}
          </span>
        </div>

        <div className="text-center pt-8 pb-5 border-b-4 border-double border-ink">
          <Link to="/" className="block hover:text-ink">
            <h1 className="font-display font-extrabold text-5xl sm:text-7xl md:text-8xl leading-none tracking-tighter">
              The Economy
            </h1>
          </Link>
          <p className="mt-3 text-lg sm:text-xl italic text-ink-soft">The numbers, without the spin.</p>
        </div>

        <nav className="flex flex-wrap justify-center gap-x-9 gap-y-2 py-3 border-b border-ink font-mono text-xs sm:text-sm uppercase tracking-wider">
          {NAV.map((item, i) => (
            <Link
              key={item.to}
              to={item.to}
              className={i === 0 ? 'border-b-2 border-accent pb-0.5' : 'pb-0.5'}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
