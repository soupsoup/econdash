const fetch = require('node-fetch');
const { parseString } = require('xml2js');
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const settingsPath = path.join(__dirname, 'wire-settings.json');
const manualWirePath = path.join(__dirname, 'wire-manual.json');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

exports.handler = async function(event, context) {
  const mode = process.env.NODE_ENV === 'production' ? 'prod' : 'dev';

  if (mode === 'prod') {
    if (event.httpMethod === 'GET') {
      try {
        const { data, error } = await supabase
          .from('wire_posts')
          .select('*')
          .order('timestamp', { ascending: false });
        if (error) throw error;
        return { statusCode: 200, body: JSON.stringify({ posts: data }) };
      } catch (err) {
        return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
      }
    }
    if (event.httpMethod === 'POST') {
      try {
        const body = JSON.parse(event.body);
        const { data, error } = await supabase
          .from('wire_posts')
          .insert(body.posts)
          .select();
        if (error) throw error;
        return { statusCode: 200, body: JSON.stringify({ posts: data }) };
      } catch (err) {
        return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
      }
    }
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  // DEV: Nitter logic
  let settings = { accounts: ['DeItaone'], interval: 60 };
  try {
    if (fs.existsSync(settingsPath)) {
      settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    }
  } catch (err) {
    // Use default settings if error
  }
  const { accounts } = settings;
  let allPosts = [];

  for (const username of accounts) {
    try {
      const url = `${process.env.VITE_NITTER_API || 'http://localhost:8080'}/${username}/rss`;
      const response = await fetch(url);
      const xml = await response.text();
      await parseString(xml, (err, result) => {
        if (!err && result.rss && result.rss.channel && result.rss.channel[0].item) {
          const posts = result.rss.channel[0].item.map(item => ({
            id: item.guid[0]._ || item.guid[0],
            username: username,
            timestamp: item.pubDate[0],
            text: item.title[0],
          }));
          allPosts = allPosts.concat(posts);
        }
      });
    } catch (err) {
      // skip this account on error
    }
  }
  // Sort posts by timestamp descending
  allPosts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  return {
    statusCode: 200,
    body: JSON.stringify({ posts: allPosts }),
  };
};