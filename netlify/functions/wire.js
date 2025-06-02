const fetch = require('node-fetch');
const { parseString } = require('xml2js');
const fs = require('fs');
const path = require('path');
const settingsPath = path.join(__dirname, 'wire-settings.json');

exports.handler = async function(event, context) {
  const nitterApi = process.env.VITE_NITTER_API || 'http://localhost:8080';
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
      const url = `${nitterApi}/${username}/rss`;
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