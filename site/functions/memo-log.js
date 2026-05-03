// POST /memo-log
//
// Email-gate logger for the investment-memo CTA on /pitch/#close.
// Persists {timestamp, email, country, referer, userAgent} to Cloudflare KV
// when the MEMO_LOG namespace is bound; otherwise logs to the Cloudflare
// Pages function log (visible in the dashboard for ~7 days).
//
// To enable persistence: in the Cloudflare dashboard,
//   Workers & Pages -> luthien-pbc-site -> Settings -> Functions -> KV
//   namespace bindings -> add binding `MEMO_LOG` pointing at a namespace
//   created via `wrangler kv:namespace create memo-log`.
//
// The function intentionally returns 204 even when KV is unbound so the
// client-side flow (PDF download) is never blocked by a misconfigured
// backend. The downside (silent log loss if KV unbound) is documented in
// the deploy README.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function onRequestPost({ request, env }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'invalid_json' }, 400);
  }

  const email = String(body?.email ?? '').trim().toLowerCase();
  if (!email || email.length > 254 || !EMAIL_RE.test(email)) {
    return json({ error: 'invalid_email' }, 400);
  }

  const entry = {
    timestamp: new Date().toISOString(),
    email,
    country: request.headers.get('cf-ipcountry') ?? 'unknown',
    referer: request.headers.get('referer') ?? '',
    userAgent: request.headers.get('user-agent') ?? '',
  };

  if (env.MEMO_LOG) {
    const key = `${entry.timestamp}__${email}`;
    await env.MEMO_LOG.put(key, JSON.stringify(entry));
  } else {
    console.log('memo-view', JSON.stringify(entry));
  }

  return new Response(null, { status: 204 });
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}
