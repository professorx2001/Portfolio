import { SYSTEM_PROMPT } from './system_prompt.js';

const ALLOWED_ROLES = new Set(['user', 'assistant']);
const MAX_QUERY_LEN = 1000;
const MAX_HISTORY_CONTENT_LEN = 400; // Keep history compact to preserve token budget

// Security: Only permit localhost origins during local development.
// When deployed on Netlify in the cloud (NETLIFY=true), strictly restrict to the production domain.
const isLocalDev = !process.env.NETLIFY || process.env.NETLIFY_DEV === 'true';

const ALLOWED_ORIGINS = isLocalDev
  ? ['https://mdzakihussain.netlify.app', 'http://localhost:5173', 'http://127.0.0.1:5173']
  : ['https://mdzakihussain.netlify.app'];

// Security: IP-based Sliding Window Rate Limiter
// Prevents automated scripts / headless bots from draining the Groq TPM & daily token quota.
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 10;     // Max 10 requests per minute per IP
const MAX_TRACKED_IPS = 2000;           // Prevent unbounded memory retention
const ipRequestHistory = new Map();

function getClientIp(req) {
  return (
    req.headers.get('x-nf-client-connection-ip') ||
    req.headers.get('client-ip') ||
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    '127.0.0.1'
  );
}

function checkRateLimit(ip) {
  // Allow unrestricted calls during local development
  if (isLocalDev && (ip === '127.0.0.1' || ip === 'localhost' || ip === '::1')) {
    return { allowed: true };
  }

  const now = Date.now();
  const timestamps = ipRequestHistory.get(ip) || [];

  // Filter timestamps within the current sliding window
  const activeTimestamps = timestamps.filter((ts) => now - ts < RATE_LIMIT_WINDOW_MS);

  if (activeTimestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    const oldestTimestamp = activeTimestamps[0];
    const retryAfterSeconds = Math.max(1, Math.ceil((oldestTimestamp + RATE_LIMIT_WINDOW_MS - now) / 1000));
    return { allowed: false, retryAfterSeconds };
  }

  activeTimestamps.push(now);
  ipRequestHistory.set(ip, activeTimestamps);

  // Evict expired entries if tracking map exceeds cap
  if (ipRequestHistory.size > MAX_TRACKED_IPS) {
    for (const [trackedIp, list] of ipRequestHistory.entries()) {
      if (!list.some((ts) => now - ts < RATE_LIMIT_WINDOW_MS)) {
        ipRequestHistory.delete(trackedIp);
      }
    }
  }

  return { allowed: true };
}

function getCorsHeaders(origin) {
  const allowOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };
}

async function callGroqWithMessages(apiKey, messages) {
  return await fetch('https://api.groq.com/openai/v1/chat/completions', {
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

  // Build message chain with limited history
  const messages = [{ role: 'system', content: SYSTEM_PROMPT }];

  const recentHistory = rawHistory.slice(-4); // Last 2 turns maximum
  let hasHistory = false;
  for (const msg of recentHistory) {
    if (msg && ALLOWED_ROLES.has(msg.role)) {
      const content = String(msg.content || '').slice(0, MAX_HISTORY_CONTENT_LEN);
      messages.push({ role: msg.role, content });
      hasHistory = true;
    }
  }

  messages.push({ role: 'user', content: userQuery });

  let groqRes = await callGroqWithMessages(apiKey, messages);

  // If rate-limited (429) and we had attached history, retry once without history
  if (groqRes.status === 429 && hasHistory) {
    console.warn('[chat.js] 429 Rate Limit hit. Retrying immediately without conversation history...');
    const compactMessages = [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userQuery }
    ];
    groqRes = await callGroqWithMessages(apiKey, compactMessages);
  }

  // If still 429, inform user politely rather than failing with generic backend down error
  if (groqRes.status === 429) {
    return {
      status: 200,
      data: {
        reply: "⏳ Whoosh, that was fast! I'm catching my breath for a few seconds on the free tier. Please ask again in 2-5 seconds!"
      }
    };
  }

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

  // Security: Origin verification
  // In production, block headless scripts that omit origin and reject foreign websites
  const referer = req.headers.get('referer') || '';
  let requestSource = origin;
  if (!requestSource && referer) {
    try {
      requestSource = new URL(referer).origin;
    } catch {
      // Invalid URL format in referer header
    }
  }

  if (!isLocalDev) {
    if (!requestSource || !ALLOWED_ORIGINS.includes(requestSource)) {
      return new Response(JSON.stringify({ error: 'Forbidden: Unauthorized or missing origin' }), {
        status: 403,
        headers: corsHeaders,
      });
    }
  } else if (origin && !ALLOWED_ORIGINS.includes(origin)) {
    return new Response(JSON.stringify({ error: 'Forbidden: Unauthorized origin' }), {
      status: 403,
      headers: corsHeaders,
    });
  }

  // Security: IP-based sliding window rate limiter
  const clientIp = getClientIp(req);
  const rateLimitResult = checkRateLimit(clientIp);
  if (!rateLimitResult.allowed) {
    return new Response(
      JSON.stringify({
        reply: "⏳ You're sending messages a bit too fast! Please wait a moment before asking again.",
        error: 'Too Many Requests',
      }),
      {
        status: 429,
        headers: {
          ...corsHeaders,
          'Retry-After': String(rateLimitResult.retryAfterSeconds),
        },
      }
    );
  }

  // Security: Payload size check (prevent DoS memory exhaustion)
  const contentLength = parseInt(req.headers.get('content-length') || '0', 10);
  if (contentLength > 10240) {
    return new Response(JSON.stringify({ error: 'Payload Too Large' }), {
      status: 413,
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

