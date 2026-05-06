// Tracking-link dashboard for luthien.cc.
//
// Routes:
//   GET /_t            → HTML dashboard
//   GET /_t/api/hits   → JSON summary of hits, queried from Analytics Engine
//
// Auth: HTTP Basic Auth via DASH_USER + DASH_PASS secrets. AE access via
// the AE_API_TOKEN secret (a CF token with `Account Analytics: Read`).
import { DASHBOARD_HTML } from "./html";

export interface Env {
  AE_ACCOUNT_ID: string;
  AE_DATASET: string;
  AE_API_TOKEN: string;
  DASH_USER: string;
  DASH_PASS: string;
}

const REALM = "luthien-tracker-dashboard";

export async function handleRequest(
  request: Request,
  env: Env,
  fetchFn: typeof fetch = fetch,
): Promise<Response> {
  const auth = checkBasicAuth(request, env);
  if (auth) return auth;

  const url = new URL(request.url);
  const path = url.pathname.replace(/\/$/, "") || "/_t";

  if (path === "/_t") {
    return new Response(DASHBOARD_HTML, {
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "no-store",
      },
    });
  }

  if (path === "/_t/api/hits") {
    return handleHits(url, env, fetchFn);
  }

  return new Response("not found", { status: 404 });
}

function checkBasicAuth(request: Request, env: Env): Response | null {
  const expectedUser = env.DASH_USER;
  const expectedPass = env.DASH_PASS;
  if (!expectedUser || !expectedPass) {
    return new Response("dashboard auth not configured", { status: 503 });
  }

  const header = request.headers.get("authorization") ?? "";
  const match = /^Basic (.+)$/.exec(header);
  if (match) {
    let decoded: string;
    try {
      decoded = atob(match[1]);
    } catch {
      decoded = "";
    }
    const sep = decoded.indexOf(":");
    if (sep >= 0) {
      const user = decoded.slice(0, sep);
      const pass = decoded.slice(sep + 1);
      if (timingSafeEqual(user, expectedUser) && timingSafeEqual(pass, expectedPass)) {
        return null;
      }
    }
  }

  return new Response("authentication required", {
    status: 401,
    headers: {
      "www-authenticate": `Basic realm="${REALM}", charset="UTF-8"`,
    },
  });
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return mismatch === 0;
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
      ORDER BY timestamp DESC
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
    {
      headers: { "cache-control": "no-store" },
    },
  );
}

function clampInt(raw: string | null, lo: number, hi: number, dflt: number): number {
  if (raw === null) return dflt;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n)) return dflt;
  return Math.max(lo, Math.min(hi, n));
}

// Allow only safe characters in ref values forwarded into AE SQL. AE's SQL
// dialect doesn't support parameterised queries, so we whitelist instead of
// escape. This matches the sanitiseRef rules in the tracker worker.
export function escapeSqlLiteral(value: string): string {
  return value.replace(/[^A-Za-z0-9._@:+\-]/g, "");
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    return handleRequest(request, env);
  },
} satisfies ExportedHandler<Env>;
