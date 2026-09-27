import { SYSTEM_PROMPT } from './system_prompt.js';

const ALLOWED_ROLES = new Set(['user', 'assistant']);
const MAX_QUERY_LEN = 1000;
const MAX_HISTORY_CONTENT_LEN = 2000;
const ALLOWED_ORIGINS = ['https://mdzakihussainx.netlify.app', 'http://localhost:5173', 'http://127.0.0.1:5173'];

function getCorsHeaders(origin) {
  const allowOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };
}

async function processChatRequest(bodyJson) {
  const userQuery = String(bodyJson.message || '').slice(0, MAX_QUERY_LEN).trim();
  const rawHistory = Array.isArray(bodyJson.history) ? bodyJson.history : [];

  if (!userQuery) {
    return {
      status: 400,
      data: { error: 'Message is required' }
    };
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return {
      status: 200,
      data: { reply: '⚠️ System Down, Sorry for inconvenience.' }
    };
  }

  const messages = [{ role: 'system', content: SYSTEM_PROMPT }];

  const recentHistory = rawHistory.slice(-6);
  for (const msg of recentHistory) {
    if (msg && ALLOWED_ROLES.has(msg.role)) {
      const content = String(msg.content || '').slice(0, MAX_HISTORY_CONTENT_LEN);
      messages.push({ role: msg.role, content });
    }
  }

  messages.push({ role: 'user', content: userQuery });

  const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'openai/gpt-oss-120b',
      messages,
      temperature: 0,
      max_tokens: 500,
    }),
  });

  if (!groqRes.ok) {
    const errText = await groqRes.text();
    console.error('[chat.js Groq API error]', groqRes.status, errText);
    return {
      status: 500,
      data: { reply: '⚠️ Something went wrong. Please try again later.' }
    };
  }

  const completion = await groqRes.json();
  const reply = completion?.choices?.[0]?.message?.content || "I couldn't generate a response.";

  return {
    status: 200,
    data: { reply }
  };
}

// Netlify Functions v2 handler (Web Standard Request / Response)
export default async (req, context) => {
  const origin = req.headers.get('origin') || '';
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return new Response('', { status: 200, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: corsHeaders,
    });
  }

  try {
    const bodyJson = await req.json().catch(() => ({}));
    const result = await processChatRequest(bodyJson);
    return new Response(JSON.stringify(result.data), {
      status: result.status,
      headers: corsHeaders,
    });
  } catch (err) {
    console.error('[chat.js Handler Error]', err);
    return new Response(JSON.stringify({ reply: '⚠️ Something went wrong. Please try again later.' }), {
      status: 500,
      headers: corsHeaders,
    });
  }
};

// Netlify Functions v1 / AWS Lambda handler for backwards compatibility
export const handler = async (event, context) => {
  const origin = event.headers?.origin || event.headers?.Origin || '';
  const corsHeaders = getCorsHeaders(origin);

  const httpMethod = event.httpMethod || 'POST';

  if (httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: '',
    };
  }

  if (httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  try {
    let bodyJson = {};
    if (event.body) {
      bodyJson = JSON.parse(event.body);
    }
    const result = await processChatRequest(bodyJson);
    return {
      statusCode: result.status,
      headers: corsHeaders,
      body: JSON.stringify(result.data),
    };
  } catch (err) {
    console.error('[chat.js Handler Error]', err);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ reply: '⚠️ Something went wrong. Please try again later.' }),
    };
  }
};
