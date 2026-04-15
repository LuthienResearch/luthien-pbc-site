// Cloudflare Pages Function: serve the pitch deck PDF same-origin.
//
// Why this exists instead of a _redirects rule: Chrome blocks cross-origin
// download redirects as "potentially insecure" even when every hop is HTTPS.
// By fetching the GitHub release asset server-side and streaming it back from
// luthien.cc directly, the download stays same-origin and the warning goes
// away.
//
// Source of truth for the PDF remains the `deck-latest` GitHub release, which
// is overwritten in place by `.github/workflows/deck-pdf.yml` on every deck
// change. This function just proxies the latest asset.

const RELEASE_ASSET_URL =
  "https://github.com/LuthienResearch/luthien-pbc-site/releases/download/deck-latest/luthien-deck.pdf";

export async function onRequestGet(context) {
  const upstream = await fetch(RELEASE_ASSET_URL, {
    redirect: "follow",
    cf: { cacheTtl: 300, cacheEverything: true },
  });

  if (!upstream.ok) {
    return new Response(`Upstream returned ${upstream.status}`, {
      status: 502,
      headers: { "content-type": "text/plain" },
    });
  }

  const headers = new Headers();
  headers.set("content-type", "application/pdf");
  headers.set("content-disposition", 'inline; filename="luthien-deck.pdf"');
  headers.set("cache-control", "public, max-age=300");
  const len = upstream.headers.get("content-length");
  if (len) headers.set("content-length", len);

  return new Response(upstream.body, { status: 200, headers });
}
