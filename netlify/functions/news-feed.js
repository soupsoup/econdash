// Headlines and links from public economy RSS feeds, merged newest-first.
// Only titles and links are passed on; readers go to the publisher for the story.

const FEEDS = [
  { name: 'NPR', url: 'https://feeds.npr.org/1017/rss.xml' },
  { name: 'The New York Times', url: 'https://rss.nytimes.com/services/xml/rss/nyt/Economy.xml' },
  { name: 'CNBC', url: 'https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=20910258' },
  { name: 'Federal Reserve', url: 'https://www.federalreserve.gov/feeds/press_monetary.xml' },
];

const MAX_ITEMS = 40;
const CACHE_MS = 10 * 60 * 1000;
let cache = { at: 0, body: null };

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };

function clean(text) {
  return String(text || '')
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (m, e) => {
      if (e[0] === '#') {
        const code = e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
        return Number.isFinite(code) ? String.fromCodePoint(code) : m;
      }
      return ENTITIES[e.toLowerCase()] ?? m;
    })
    .replace(/\s+/g, ' ')
    .trim();
}

function tag(block, name) {
  const m = block.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, 'i'));
  return m ? m[1] : '';
}

function parseItems(xml, feed) {
  const items = [];
  for (const m of xml.matchAll(/<item[\s>][\s\S]*?<\/item>/gi)) {
    const block = m[0];
    const title = clean(tag(block, 'title'));
    let link = clean(tag(block, 'link')) || clean(tag(block, 'guid'));
    const dateText = clean(tag(block, 'pubDate')) || clean(tag(block, 'dc:date'));
    const time = Date.parse(dateText);
    if (!title || !/^https?:\/\//i.test(link)) continue;
    if (feed.keep && !feed.keep.test(title)) continue;
    items.push({
      title,
      link,
      source: feed.name,
      published: Number.isFinite(time) ? new Date(time).toISOString() : null,
    });
  }
  return items;
}

async function loadFeed(feed) {
  const res = await fetch(feed.url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; TheEconomyBot/1.0)', Accept: 'application/rss+xml, application/xml, text/xml' },
    signal: AbortSignal.timeout(8000),
    redirect: 'follow',
  });
  if (!res.ok) throw new Error(`${feed.name}: HTTP ${res.status}`);
  return parseItems(await res.text(), feed);
}

async function build() {
  const results = await Promise.allSettled(FEEDS.map(loadFeed));
  const seen = new Set();
  const items = [];
  results.forEach((r, i) => {
    if (r.status === 'rejected') console.error('news-feed:', FEEDS[i].name, r.reason && r.reason.message);
    else items.push(...r.value);
  });
  const now = Date.now();
  const unique = items.filter(it => {
    const key = it.title.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    // ignore items dated in the future (bad feed clocks)
    return !it.published || Date.parse(it.published) <= now + 3600 * 1000;
  });
  unique.sort((a, b) => (Date.parse(b.published || 0) || 0) - (Date.parse(a.published || 0) || 0));
  return JSON.stringify({ updatedAt: new Date().toISOString(), items: unique.slice(0, MAX_ITEMS) });
}

exports.handler = async function (event) {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }
  try {
    if (!cache.body || Date.now() - cache.at > CACHE_MS) {
      const body = await build();
      if (JSON.parse(body).items.length > 0 || !cache.body) cache = { at: Date.now(), body };
    }
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=300' },
      body: cache.body,
    };
  } catch (error) {
    console.error('news-feed failed:', error);
    return { statusCode: 502, body: JSON.stringify({ error: 'Could not load headlines' }) };
  }
};
