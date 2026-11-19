import React from 'react';
import { Link, useLocation } from 'react-router-dom';

interface HeaderProps {
  lastUpdated?: string | null;
  hasNewData?: boolean;
  onRefresh?: () => void;
}

const NAV = [
  { href: '/', label: 'Scoreboard', match: (p: string) => p === '/' },
  { href: '/indicator/industrial-production-mfg', label: 'Manufacturing', match: (p: string) => p.includes('-mfg') || p.includes('manufacturing') || p.includes('capital-goods') },
  { href: '/#presidential-comparison', label: 'Administrations', match: () => false },
  { href: '/posts', label: 'Updates', match: (p: string) => p.startsWith('/post') },
];

export default function Header(_props: HeaderProps) {
  const { pathname } = useLocation();

  return (
    <header className="bg-paper text-ink">
      <div className="stripe h-2.5" aria-hidden="true" />
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-3 py-5 border-b border-rule">
          <Link to="/" className="font-display font-extrabold text-3xl sm:text-4xl tracking-wider leading-none hover:text-ink">
            The Economy
          </Link>
          <nav className="flex flex-wrap gap-x-7 gap-y-2 font-display font-bold text-lg sm:text-xl tracking-[0.08em]">
            {NAV.map(item => {
              const active = item.match(pathname);
              return (
                <a
                  key={item.label}
                  href={item.href}
                  className={`pb-0.5 border-b-[3px] ${active ? 'border-flag' : 'border-transparent'}`}
                  aria-current={active ? 'page' : undefined}
                >
                  {item.label}
                </a>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}
