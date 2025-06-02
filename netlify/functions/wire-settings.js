const fs = require('fs');
const path = require('path');
const settingsPath = path.join(__dirname, 'wire-settings.json');

exports.handler = async function(event) {
  if (event.httpMethod === 'GET') {
    try {
      const data = fs.readFileSync(settingsPath, 'utf8');
      return { statusCode: 200, body: data };
    } catch (err) {
      return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
    }
  }
  if (event.httpMethod === 'POST' || event.httpMethod === 'PUT') {
    try {
      fs.writeFileSync(settingsPath, event.body);
      return { statusCode: 200, body: event.body };
    } catch (err) {
      return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
    }
  }
  return { statusCode: 405, body: 'Method Not Allowed' };
}; 