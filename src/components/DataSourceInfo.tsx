import React from 'react';

const SOURCES = [
  {
    name: 'Bureau of Labor Statistics (BLS)',
    blurb: 'The principal fact-finding agency of the U.S. government for labor economics and statistics, within the Department of Labor.',
    href: 'https://www.bls.gov/data/',
    link: 'Visit BLS Data',
  },
  {
    name: 'Federal Reserve Economic Data (FRED)',
    blurb: 'A database of hundreds of thousands of economic time series from national, international, public and private sources, run by the St. Louis Fed.',
    href: 'https://fred.stlouisfed.org/',
    link: 'Visit FRED',
  },
  {
    name: 'U.S. Energy Information Administration (EIA)',
    blurb: 'Collects, analyzes and publishes independent and impartial energy information to support sound policymaking and efficient markets.',
    href: 'https://www.eia.gov/tools/api/index.php',
    link: 'Visit EIA Data',
  },
];

const DataSourceInfo: React.FC = () => {
  return (
    <section className="border-t-[3px] border-ink pt-5">
      <div className="flex items-baseline justify-between gap-3 mb-6">
        <h2 className="section-title">Data Sources</h2>
        <span className="eyebrow">Where the numbers come from</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-x-10 gap-y-8">
        {SOURCES.map(source => (
          <div key={source.name} className="border-t-2 border-ink pt-3">
            <h3 className="font-display font-extrabold text-xl leading-tight">{source.name}</h3>
            <p className="mt-2 text-base leading-snug text-ink-soft">{source.blurb}</p>
            <a
              href={source.href}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-block font-mono text-sm uppercase tracking-wider border-b border-ink"
            >
              {source.link} ↗
            </a>
          </div>
        ))}
      </div>

      <div className="mt-10 py-5 border-y border-ink">
        <div className="eyebrow !text-accent">Update schedule</div>
        <p className="mt-2 text-base text-ink-soft max-w-3xl">
          This dashboard checks for new data daily from all sources. Different indicators are published at different frequencies:
        </p>
        <dl className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-x-8 gap-y-3 text-base">
          <div><dt className="eyebrow">Daily</dt><dd>Stock market indices</dd></div>
          <div><dt className="eyebrow">Weekly</dt><dd>Gas prices, mortgage rates</dd></div>
          <div><dt className="eyebrow">Monthly</dt><dd>Unemployment, inflation, jobs, manufacturing</dd></div>
          <div><dt className="eyebrow">Quarterly</dt><dd>GDP growth, federal debt</dd></div>
          <div><dt className="eyebrow">Yearly</dt><dd>Median household income</dd></div>
        </dl>
      </div>
    </section>
  );
};

export default DataSourceInfo;
