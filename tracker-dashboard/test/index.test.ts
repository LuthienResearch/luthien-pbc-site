import { describe, it, expect, vi } from "vitest";
import { handleRequest, escapeSqlLiteral, type Env } from "../src/index";

const ENV: Env = {
  AE_ACCOUNT_ID: "acct-test",
  AE_DATASET: "luthien_tracker_hits",
  AE_API_TOKEN: "tok-test",
  DASH_USER: "alice",
  DASH_PASS: "s3cret",
};

function basicAuth(user: string, pass: string): string {
  return "Basic " + btoa(`${user}:${pass}`);
}

function req(path: string, headers: Record<string, string> = {}): Request {
  return new Request(`https://luthien.cc${path}`, { headers });
}

function fakeAEFetch(json: unknown, ok = true): typeof fetch {
  return vi.fn(async () =>
    new Response(JSON.stringify(json), {
      status: ok ? 200 : 500,
      headers: { "content-type": "application/json" },
    }),
  ) as unknown as typeof fetch;
}

describe("escapeSqlLiteral", () => {
  it("strips characters outside the safe set", () => {
    expect(escapeSqlLiteral("alice'; DROP TABLE--")).toBe("aliceDROPTABLE--");
    expect(escapeSqlLiteral("anthropic-2026-05")).toBe("anthropic-2026-05");
    expect(escapeSqlLiteral("scott@example.com")).toBe("scott@example.com");
  });
});

describe("auth", () => {
  it("returns 401 with WWW-Authenticate when no header", async () => {
    const res = await handleRequest(req("/_t"), ENV, fakeAEFetch({}));
    expect(res.status).toBe(401);
    expect(res.headers.get("www-authenticate")).toMatch(/^Basic realm=/);
  });

  it("returns 401 on bad password", async () => {
    const res = await handleRequest(
      req("/_t", { authorization: basicAuth("alice", "wrong") }),
      ENV,
      fakeAEFetch({}),
    );
    expect(res.status).toBe(401);
  });

  it("returns 401 on bad username", async () => {
    const res = await handleRequest(
      req("/_t", { authorization: basicAuth("eve", "s3cret") }),
      ENV,
      fakeAEFetch({}),
    );
    expect(res.status).toBe(401);
  });

  it("returns 503 when env secrets are missing", async () => {
    const partial = { ...ENV, DASH_USER: "", DASH_PASS: "" };
    const res = await handleRequest(req("/_t"), partial, fakeAEFetch({}));
    expect(res.status).toBe(503);
  });
});

describe("HTML route", () => {
  it("serves the dashboard on /_t when authed", async () => {
    const res = await handleRequest(
      req("/_t", { authorization: basicAuth("alice", "s3cret") }),
      ENV,
      fakeAEFetch({}),
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toMatch(/text\/html/);
    const body = await res.text();
    expect(body).toMatch(/luthien.cc tracker/);
    expect(body).toMatch(/api\/hits/);
  });

  it("serves the dashboard on /_t/ trailing slash", async () => {
    const res = await handleRequest(
      req("/_t/", { authorization: basicAuth("alice", "s3cret") }),
      ENV,
      fakeAEFetch({}),
    );
    expect(res.status).toBe(200);
  });
});

describe("/_t/api/hits", () => {
  it("returns summary data when no ref param", async () => {
    const aeJson = { rows: 2, data: [{ ref: "a", hits: "5" }, { ref: "b", hits: "3" }] };
    const f = fakeAEFetch(aeJson);
    const res = await handleRequest(
      req("/_t/api/hits", { authorization: basicAuth("alice", "s3cret") }),
      ENV,
      f,
    );
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.rows).toBe(2);
    expect(body.data.length).toBe(2);
    expect(body.params.ref).toBeNull();
    // Verify the SQL we sent doesn't include a ref filter.
    const call = (f as any).mock.calls[0];
    const sentSql = call[1].body as string;
    expect(sentSql).toMatch(/GROUP BY blob1/);
    expect(sentSql).not.toMatch(/blob1 = '/);
  });

  it("returns drill-down rows when ref param is set", async () => {
    const aeJson = { rows: 1, data: [{ ts: "2026-05-05 00:00:00", path: "/pitch", country: "US" }] };
    const f = fakeAEFetch(aeJson);
    const res = await handleRequest(
      req("/_t/api/hits?ref=alice-2026-05", { authorization: basicAuth("alice", "s3cret") }),
      ENV,
      f,
    );
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.params.ref).toBe("alice-2026-05");
    const sentSql = (f as any).mock.calls[0][1].body as string;
    expect(sentSql).toMatch(/blob1 = 'alice-2026-05'/);
    expect(sentSql).toMatch(/ORDER BY timestamp DESC/);
  });

  it("sanitises the ref parameter before injecting into SQL", async () => {
    const f = fakeAEFetch({ rows: 0, data: [] });
    await handleRequest(
      req("/_t/api/hits?ref=" + encodeURIComponent("evil'; DROP TABLE; --"), {
        authorization: basicAuth("alice", "s3cret"),
      }),
      ENV,
      f,
    );
    const sentSql = (f as any).mock.calls[0][1].body as string;
    expect(sentSql).not.toMatch(/DROP TABLE/);
    expect(sentSql).toMatch(/blob1 = 'evilDROPTABLE--'/);
  });

  it("clamps days to a reasonable range", async () => {
    const f = fakeAEFetch({ rows: 0, data: [] });
    await handleRequest(
      req("/_t/api/hits?days=99999", { authorization: basicAuth("alice", "s3cret") }),
      ENV,
      f,
    );
    const sentSql = (f as any).mock.calls[0][1].body as string;
    expect(sentSql).toMatch(/INTERVAL '365' DAY/);

    const f2 = fakeAEFetch({ rows: 0, data: [] });
    await handleRequest(
      req("/_t/api/hits?days=garbage", { authorization: basicAuth("alice", "s3cret") }),
      ENV,
      f2,
    );
    const sentSql2 = (f2 as any).mock.calls[0][1].body as string;
    expect(sentSql2).toMatch(/INTERVAL '30' DAY/);
  });

  it("returns 502 when AE responds non-2xx", async () => {
    const res = await handleRequest(
      req("/_t/api/hits", { authorization: basicAuth("alice", "s3cret") }),
      ENV,
      fakeAEFetch({ errors: ["boom"] }, false),
    );
    expect(res.status).toBe(502);
  });
});

describe("not found", () => {
  it("returns 404 for unknown paths under /_t", async () => {
    const res = await handleRequest(
      req("/_t/nope", { authorization: basicAuth("alice", "s3cret") }),
      ENV,
      fakeAEFetch({}),
    );
    expect(res.status).toBe(404);
  });
});
