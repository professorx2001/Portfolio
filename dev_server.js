import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Automatically load .env file if present
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const idx = trimmed.indexOf('=');
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim().replace(/^['"]|['"]$/g, '');
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  });
}

import chatHandler from './netlify/functions/chat.js';

const PORT = 5001;

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  if (url.pathname === '/.netlify/functions/chat' || url.pathname === '/chat') {
    if (req.method === 'OPTIONS') {
      res.writeHead(200, {
        'Access-Control-Allow-Origin': 'http://localhost:5173',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      });
      res.end();
      return;
    }

    if (req.method === 'POST') {
      let rawBody = '';
      for await (const chunk of req) {
        rawBody += chunk;
      }

      const headers = new Headers();
      for (const [k, v] of Object.entries(req.headers)) {
        if (Array.isArray(v)) {
          v.forEach(val => headers.append(k, val));
        } else if (v) {
          headers.set(k, v);
        }
      }

      const webReq = new Request(`http://localhost:${PORT}${req.url}`, {
        method: 'POST',
        headers,
        body: rawBody,
      });

      try {
        const webRes = await chatHandler(webReq, {});
        const resBody = await webRes.text();
        const resHeaders = Object.fromEntries(webRes.headers.entries());
        resHeaders['Access-Control-Allow-Origin'] = 'http://localhost:5173';

        res.writeHead(webRes.status, resHeaders);
        res.end(resBody);
      } catch (err) {
        console.error('[dev_server Error]', err);
        res.writeHead(500, {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': 'http://localhost:5173',
        });
        res.end(JSON.stringify({ reply: 'Server error' }));
      }
      return;
    }
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

server.listen(PORT, () => {
  console.log(`🚀 Node.js Backend Dev Server running on http://127.0.0.1:${PORT}`);
  console.log(`   Listening for /.netlify/functions/chat`);
});
