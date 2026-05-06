// Tracking-link worker for luthien.cc.
//
// When a request to a tracked path carries a `?ref=<token>` query param, log
// the hit to Analytics Engine and serve the response normally. Without the
// param, the worker is a transparent passthrough.
//
// The worker is on the critical path for routes listed in wrangler.jsonc, so
// any error in the logging path falls through to a plain origin fetch.

export interface Env {
  TRACKER_HITS: AnalyticsEngineDataset;
}

type FetchFn = typeof fetch;

const REF_PARAM = "ref";
const MAX_REF_LEN = 128;
const MAX_HEADER_LEN = 256;

export async function handleRequest(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
  fetchFn: FetchFn = fetch,
): Promise<Response> {
  try {
    const url = new URL(request.url);
    const ref = sanitizeRef(url.searchParams.get(REF_PARAM));

    if (ref && env.TRACKER_HITS) {
      ctx.waitUntil(
        (async () => {
          try {
            logHit(env.TRACKER_HITS, request, url, ref);
          } catch (err) {
            console.error("tracker logHit error", err);
          }
        })(),
      );
    }
  } catch (err) {
    console.error("tracker pre-fetch error", err);
  }

  return fetchFn(request);
}

export function sanitizeRef(value: string | null): string | null {
  if (!value) return null;
  // Canonicalise to the same character set the dashboard's SQL whitelist
  // accepts. Anything outside [A-Za-z0-9._-] is stripped, and runs of `-`
  // are collapsed (so a hostile `?ref=foo--bar` can't later smuggle a SQL
  // line-comment if the dashboard's query shape changes). Keeps logs and
  // queries on the same alphabet.
  const canonical = value.trim().replace(/[^A-Za-z0-9._-]/g, "").replace(/-{2,}/g, "-");
  if (!canonical) return null;
  if (canonical.length > MAX_REF_LEN) return canonical.slice(0, MAX_REF_LEN);
  return canonical;
}

function logHit(
  dataset: AnalyticsEngineDataset,
  request: Request,
  url: URL,
  ref: string,
): void {
  const cf = (request.cf ?? {}) as IncomingRequestCfProperties;
  const ua = request.headers.get("user-agent") ?? "";
  const referrer = request.headers.get("referer") ?? "";

  dataset.writeDataPoint({
    blobs: [
      ref,
      url.pathname,
      ua.slice(0, MAX_HEADER_LEN),
      referrer.slice(0, MAX_HEADER_LEN),
      String(cf.country ?? ""),
      String(cf.colo ?? ""),
      String(cf.asOrganization ?? ""),
    ],
    doubles: [],
    indexes: [ref],
  });
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // Last-resort safety net: if the worker isolate panics before our own
    // try/catch can run, Cloudflare will silently forward the request to
    // origin instead of returning a 5xx. This worker now sits on the
    // critical path of every luthien.cc URL; without this, any uncaught
    // bug here takes the whole site dark.
    ctx.passThroughOnException();
    return handleRequest(request, env, ctx);
  },
} satisfies ExportedHandler<Env>;
