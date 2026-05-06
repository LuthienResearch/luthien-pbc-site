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
        Promise.resolve().then(() => logHit(env.TRACKER_HITS, request, url, ref)),
      );
    }
  } catch (err) {
    console.error("tracker pre-fetch error", err);
  }

  return fetchFn(request);
}

export function sanitizeRef(value: string | null): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.length > MAX_REF_LEN) return trimmed.slice(0, MAX_REF_LEN);
  return trimmed;
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
    return handleRequest(request, env, ctx);
  },
} satisfies ExportedHandler<Env>;
