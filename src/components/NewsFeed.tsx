import React from 'react';
import { useQuery } from 'react-query';
import axios from 'axios';
import { Link } from 'react-router-dom';

interface NewsItem {
  title: string;
  link: string;
  source: string;
  published: string | null;
}

interface NewsResponse {
  updatedAt: string;
  items: NewsItem[];
}

const fetchNews = async (): Promise<NewsResponse> => {
  const { data } = await axios.get<NewsResponse>('/.netlify/functions/news-feed', { timeout: 20000 });
  return data;
};

function timeAgo(iso: string | null): string {
  if (!iso) return '';
  const minutes = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (minutes < 60) return `${Math.max(1, minutes)}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return days < 7 ? `${days}d ago` : new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

interface NewsFeedProps {
  /** Show only the newest N headlines (all of them when omitted). */
  limit?: number;
  /** Lay the list out in two columns and link to the full list on /posts. */
  compact?: boolean;
}

export default function NewsFeed({ limit, compact = false }: NewsFeedProps) {
  const { data, isLoading, isError } = useQuery('newsFeed', fetchNews, {
    staleTime: 1000 * 60 * 5,
    refetchInterval: 1000 * 60 * 10,
    retry: 1,
  });

  const items = (data?.items ?? []).slice(0, limit);
  const sources = Array.from(new Set(items.map(i => i.source)));

  return (
    <section className={compact ? 'mt-14' : 'mt-16'}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b-[3px] border-ink pb-2">
        <h2 className="section-title !text-5xl sm:!text-6xl">In the news</h2>
        {sources.length > 0 && (
          <span className="font-display font-bold text-lg tracking-[0.12em] uppercase text-accent">
            Via {sources.join(', ')}
          </span>
        )}
      </div>

      {isLoading && <p className="py-6 eyebrow">Loading headlines...</p>}
      {isError && <p className="py-6 text-ink-soft">Headlines are unavailable right now. Please try again shortly.</p>}

      <ul className={compact ? 'grid grid-cols-1 lg:grid-cols-2 lg:gap-x-10' : ''}>
        {items.map(item => (
          <li key={item.link} className="border-b border-rule">
            <a
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="block py-4 hover:bg-white/5 hover:text-inherit"
            >
              <div className="eyebrow !text-base">
                {item.source}
                {item.published && <> · {timeAgo(item.published)}</>}
              </div>
              <div className="mt-1 text-xl sm:text-2xl font-semibold leading-snug">
                {item.title} <span aria-hidden="true" className="text-accent">↗</span>
                <span className="sr-only"> (opens in a new tab)</span>
              </div>
            </a>
          </li>
        ))}
      </ul>

      {compact && items.length > 0 && (
        <div className="mt-5">
          <Link to="/posts" className="font-display font-bold text-lg tracking-[0.1em] uppercase border-b-2 border-ink pb-0.5">
            More headlines →
          </Link>
        </div>
      )}
    </section>
  );
}
