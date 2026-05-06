import { describe, it, expect, vi } from "vitest";
import { handleRequest, sanitizeRef, type Env } from "../src/index";

function createMockDataset(): { ds: AnalyticsEngineDataset; writes: AnalyticsEngineDataPoint[] } {
  const writes: AnalyticsEngineDataPoint[] = [];
  const ds = {
    writeDataPoint: vi.fn((p: AnalyticsEngineDataPoint) => {
      writes.push(p);
    }),
  } as unknown as AnalyticsEngineDataset;
  return { ds, writes };
}

function createCtx(): { ctx: ExecutionContext; waited: Promise<unknown>[] } {
  const waited: Promise<unknown>[] = [];
  const ctx = {
    waitUntil: (p: Promise<unknown>) => {
      waited.push(p);
    },
    passThroughOnException: () => {},
  } as unknown as ExecutionContext;
  return { ctx, waited };
}

const OK_BODY = "<!doctype html><title>pitch</title>";

function originFetch(): typeof fetch {
  return vi.fn(async () =>
    new Response(OK_BODY, { status: 200, headers: { "content-type": "text/html" } }),
  ) as unknown as typeof fetch;
}

function makeReq(url: string, headers: Record<string, string> = {}): Request {
  return new Request(url, { headers });
}

describe("sanitizeRef", () => {
  it("returns null for null/empty/whitespace", () => {
    expect(sanitizeRef(null)).toBeNull();
    expect(sanitizeRef("")).toBeNull();
    expect(sanitizeRef("   ")).toBeNull();
  });

  it("trims surrounding whitespace", () => {
    expect(sanitizeRef("  alice  ")).toBe("alice");
  });

  it("truncates absurdly long values", () => {
    const long = "x".repeat(500);
    expect(sanitizeRef(long)?.length).toBe(128);
  });

  it("preserves canonical token shapes", () => {
    expect(sanitizeRef("anthropic-2026-05")).toBe("anthropic-2026-05");
    expect(sanitizeRef("scott_vc_intro")).toBe("scott_vc_intro");
    expect(sanitizeRef("v1.2.3")).toBe("v1.2.3");
  });

  it("strips characters outside [A-Za-z0-9._-] so logs match the dashboard's read whitelist", () => {
    expect(sanitizeRef("scott@example.com")).toBe("scottexample.com");
    expect(sanitizeRef("foo bar")).toBe("foobar");
    expect(sanitizeRef("foo+bar")).toBe("foobar");
    expect(sanitizeRef("alice'; DROP TABLE--")).toBe("aliceDROPTABLE-");
  });

  it("collapses runs of dashes (defense-in-depth against SQL line comments)", () => {
    expect(sanitizeRef("foo--bar")).toBe("foo-bar");
    expect(sanitizeRef("a----b")).toBe("a-b");
  });

  it("returns null when sanitisation strips everything", () => {
    expect(sanitizeRef("@@@")).toBeNull();
    expect(sanitizeRef("   '   ")).toBeNull();
  });
});

describe("handleRequest", () => {
  it("forwards to origin and returns the origin response", async () => {
    const env: Env = { TRACKER_HITS: createMockDataset().ds };
    const { ctx } = createCtx();
    const fetcher = originFetch();

    const res = await handleRequest(
      makeReq("https://luthien.cc/pitch"),
      env,
      ctx,
      fetcher,
    );

    expect(res.status).toBe(200);
    expect(await res.text()).toBe(OK_BODY);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("does not log when no ref param is present", async () => {
    const { ds, writes } = createMockDataset();
    const { ctx, waited } = createCtx();

    await handleRequest(
      makeReq("https://luthien.cc/pitch"),
      { TRACKER_HITS: ds },
      ctx,
      originFetch(),
    );
    await Promise.all(waited);

    expect(writes).toHaveLength(0);
  });

  it("logs a hit when ?ref= is present", async () => {
    const { ds, writes } = createMockDataset();
    const { ctx, waited } = createCtx();

    await handleRequest(
      makeReq("https://luthien.cc/pitch?ref=anthropic-2026-05", {
        "user-agent": "Mozilla/5.0",
        referer: "https://twitter.com/x/status/1",
      }),
      { TRACKER_HITS: ds },
      ctx,
      originFetch(),
    );
    await Promise.all(waited);

    expect(writes).toHaveLength(1);
    const point = writes[0];
    expect(point.indexes).toEqual(["anthropic-2026-05"]);
    expect(point.blobs?.[0]).toBe("anthropic-2026-05");
    expect(point.blobs?.[1]).toBe("/pitch");
    expect(point.blobs?.[2]).toBe("Mozilla/5.0");
    expect(point.blobs?.[3]).toBe("https://twitter.com/x/status/1");
  });

  it("ignores blank ref values", async () => {
    const { ds, writes } = createMockDataset();
    const { ctx, waited } = createCtx();

    await handleRequest(
      makeReq("https://luthien.cc/pitch?ref=  "),
      { TRACKER_HITS: ds },
      ctx,
      originFetch(),
    );
    await Promise.all(waited);

    expect(writes).toHaveLength(0);
  });

  it("falls through to origin even if logging throws", async () => {
    const ds = {
      writeDataPoint: () => {
        throw new Error("boom");
      },
    } as unknown as AnalyticsEngineDataset;
    const { ctx, waited } = createCtx();

    const res = await handleRequest(
      makeReq("https://luthien.cc/pitch?ref=alice"),
      { TRACKER_HITS: ds },
      ctx,
      originFetch(),
    );
    // waitUntil promise rejects; surface that for assertion but don't break the response path.
    await Promise.allSettled(waited);

    expect(res.status).toBe(200);
    expect(await res.text()).toBe(OK_BODY);
  });

  it("passes through PDF responses unchanged", async () => {
    const fetcher = vi.fn(async () =>
      new Response("%PDF-1.7 fake", {
        status: 200,
        headers: {
          "content-type": "application/pdf",
          "cache-control": "public, max-age=14400",
        },
      }),
    ) as unknown as typeof fetch;
    const { ds } = createMockDataset();
    const { ctx } = createCtx();

    const res = await handleRequest(
      makeReq("https://luthien.cc/pitch.pdf?ref=alice"),
      { TRACKER_HITS: ds },
      ctx,
      fetcher,
    );

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("application/pdf");
    expect(res.headers.get("cache-control")).toBe("public, max-age=14400");
  });
});
