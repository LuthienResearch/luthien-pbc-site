// Tracking-link dashboard for luthien.cc.
//
// Routes:
//   GET  /_t              → HTML dashboard (requires session)
//   GET  /_t/login        → login form
//   POST /_t/login        → validates creds, sets session cookie, 302 to /_t
//   POST /_t/logout       → clears cookie, 302 to /_t/login
//   GET  /_t/api/hits     → JSON summary, queried from Analytics Engine
//
// Session cookies are HMAC-SHA256-signed with SESSION_SECRET (no DB).
// Basic Auth is also accepted as a fallback for scripts/curl.
import { DASHBOARD_HTML } from "./html";
import { loginHtml } from "./login";
import {
  buildSessionCookie,
  clearSessionCookie,
  readSessionCookie,
  signSession,
  timingSafeEqual,
  verifySession,
  SESSION_TTL_SECONDS,
} from "./auth";

export interface Env {
  AE_ACCOUNT_ID: string;
  AE_DATASET: string;
  AE_API_TOKEN: string;
  DASH_USER: string;
  DASH_PASS: string;
  SESSION_SECRET: string;
}

export async function handleRequest(
  request: Request,
  env: Env,
  fetchFn: typeof fetch = fetch,
): Promise<Response> {
  if (!env.DASH_USER || !env.DASH_PASS || !env.SESSION_SECRET) {
    return new Response("dashboard auth not configured", { status: 503 });
  }

  const url = new URL(request.url);
  const path = url.pathname.replace(/\/$/, "") || "/_t";

  if (path === "/_t/login") {
    if (request.method === "POST") return handleLoginPost(request, env);
    return new Response(loginHtml(url.searchParams.get("error") === "1"), {
      headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
    });
  }

  if (path === "/_t/logout") {
    return new Response(null, {
      status: 302,
      headers: { location: "/_t/login", "set-cookie": clearSessionCookie() },
    });
  }

  const authed = await isAuthed(request, env);

  if (!authed) {
    if (path === "/_t/api/hits") {
      return Response.json({ error: "unauthorized" }, { status: 401 });
    }
    return new Response(null, { status: 302, headers: { location: "/_t/login" } });
  }

  if (path === "/_t") {
    return new Response(DASHBOARD_HTML, {
      headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
    });
  }

  if (path === "/_t/api/hits") {
    return handleHits(url, env, fetchFn);
  }

  return new Response("not found", { status: 404 });
}

async function isAuthed(request: Request, env: Env): Promise<boolean> {
  const cookie = readSessionCookie(request);
  if (cookie) {
    const session = await verifySession(cookie, env.SESSION_SECRET);
    if (session && timingSafeEqual(session.u, env.DASH_USER)) return true;
  }
  return checkBasicAuth(request, env);
}

function checkBasicAuth(request: Request, env: Env): boolean {
  const header = request.headers.get("authorization") ?? "";
  const match = /^Basic (.+)$/.exec(header);
  if (!match) return false;
  let decoded: string;
  try {
    decoded = atob(match[1]);
  } catch {
    return false;
  }
  const sep = decoded.indexOf(":");
  if (sep < 0) return false;
  const user = decoded.slice(0, sep);
  const pass = decoded.slice(sep + 1);
  return timingSafeEqual(user, env.DASH_USER) && timingSafeEqual(pass, env.DASH_PASS);
}

async function handleLoginPost(request: Request, env: Env): Promise<Response> {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("application/x-www-form-urlencoded")) {
    return new Response("expected form post", { status: 400 });
  }
  const body = await request.text();
  const params = new URLSearchParams(body);
  const user = params.get("username") ?? "";
  const pass = params.get("password") ?? "";

  if (!timingSafeEqual(user, env.DASH_USER) || !timingSafeEqual(pass, env.DASH_PASS)) {
    return new Response(null, { status: 302, headers: { location: "/_t/login?error=1" } });
  }

  const exp = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const session = await signSession({ u: user, exp }, env.SESSION_SECRET);
  return new Response(null, {
    status: 302,
    headers: {
      location: "/_t",
      "set-cookie": buildSessionCookie(session),
    },
  });
}

async function handleHits(url: URL, env: Env, fetchFn: typeof fetch): Promise<Response> {
  const days = clampInt(url.searchParams.get("days"), 1, 365, 30);
  const ref = url.searchParams.get("ref");

  let sql: string;
  if (ref) {
    sql = `
      SELECT
        timestamp AS hit_time,
        blob2 AS path,
        blob3 AS ua,
        blob4 AS referrer,
        blob5 AS country,
        blob6 AS colo,
        blob7 AS asn
      FROM ${env.AE_DATASET}
      WHERE timestamp > NOW() - INTERVAL '${days}' DAY
        AND blob1 = '${escapeSqlLiteral(ref)}'
      ORDER BY hit_time DESC
      LIMIT 500
      FORMAT JSON
    `;
  } else {
    sql = `
      SELECT
        blob1 AS ref,
        count() AS hits,
        min(timestamp) AS first_seen,
        max(timestamp) AS last_seen,
        count(DISTINCT blob5) AS country_count,
        count(DISTINCT blob2) AS path_count
      FROM ${env.AE_DATASET}
      WHERE timestamp > NOW() - INTERVAL '${days}' DAY
      GROUP BY blob1
      ORDER BY hits DESC
      LIMIT 200
      FORMAT JSON
    `;
  }

  const aeUrl = `https://api.cloudflare.com/client/v4/accounts/${env.AE_ACCOUNT_ID}/analytics_engine/sql`;
  const aeRes = await fetchFn(aeUrl, {
    method: "POST",
    headers: {
      authorization: `Bearer ${env.AE_API_TOKEN}`,
      "content-type": "text/plain",
    },
    body: sql,
  });

  if (!aeRes.ok) {
    const body = await aeRes.text();
    return Response.json(
      { error: "ae query failed", status: aeRes.status, body },
      { status: 502 },
    );
  }

  const json = (await aeRes.json()) as { data?: unknown[]; rows?: number };
  return Response.json(
    {
      rows: json.rows ?? 0,
      data: json.data ?? [],
      params: { days, ref: ref ?? null },
    },
    { headers: { "cache-control": "no-store" } },
  );
}

function clampInt(raw: string | null, lo: number, hi: number, dflt: number): number {
  if (raw === null) return dflt;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n)) return dflt;
  return Math.max(lo, Math.min(hi, n));
}

export function escapeSqlLiteral(value: string): string {
  return value.replace(/[^A-Za-z0-9._@:+\-]/g, "");
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    return handleRequest(request, env);
  },
} satisfies ExportedHandler<Env>;
