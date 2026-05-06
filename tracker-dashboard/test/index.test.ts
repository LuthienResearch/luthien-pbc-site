import { describe, it, expect, vi } from "vitest";
import { handleRequest, escapeSqlLiteral, type Env } from "../src/index";
import { signSession } from "../src/auth";

const ENV: Env = {
  AE_ACCOUNT_ID: "acct-test",
  AE_DATASET: "luthien_tracker_hits",
  AE_API_TOKEN: "tok-test",
  DASH_USER: "alice",
  DASH_PASS: "s3cret",
  SESSION_SECRET: "test-secret-32-bytes-min--------",
};

function basicAuth(user: string, pass: string): string {
  return "Basic " + btoa(`${user}:${pass}`);
}

function req(path: string, init: RequestInit = {}): Request {
  return new Request(`https://luthien.cc${path}`, init);
}

function fakeAEFetch(json: unknown, ok = true): typeof fetch {
  return vi.fn(async () =>
    new Response(JSON.stringify(json), {
      status: ok ? 200 : 500,
      headers: { "content-type": "application/json" },
    }),
  ) as unknown as typeof fetch;
}

async function validSessionCookie(env: Env, exp?: number): Promise<string> {
  const session = await signSession(
    { u: env.DASH_USER, exp: exp ?? Math.floor(Date.now() / 1000) + 3600 },
    env.SESSION_SECRET,
  );
  return `luthien_dash=${session}`;
}

describe("canonicalizeRef", () => {
  it("strips characters outside [A-Za-z0-9._-]", () => {
    // Quotes, semicolons, and spaces must die — these are the SQL-literal
    // escape characters. Whatever is left is benign inside a single-quoted
    // ClickHouse literal.
    expect(escapeSqlLiteral("alice'; DROP TABLE--")).toBe("aliceDROPTABLE-");
    expect(escapeSqlLiteral("scott@example.com")).toBe("scottexample.com");
    expect(escapeSqlLiteral("foo bar baz")).toBe("foobarbaz");
    expect(escapeSqlLiteral("foo+bar")).toBe("foobar");
  });

  it("collapses runs of dashes so `--` (line comment) cannot survive", () => {
    expect(escapeSqlLiteral("foo--bar")).toBe("foo-bar");
    expect(escapeSqlLiteral("foo----bar")).toBe("foo-bar");
    expect(escapeSqlLiteral("a-b-c--d---e")).toBe("a-b-c-d-e");
  });

  it("preserves the canonical token shape Jai actually uses", () => {
    expect(escapeSqlLiteral("anthropic-2026-05")).toBe("anthropic-2026-05");
    expect(escapeSqlLiteral("scott_vc_intro")).toBe("scott_vc_intro");
    expect(escapeSqlLiteral("v1.2.3")).toBe("v1.2.3");
  });
});

describe("config", () => {
  it("returns 503 when secrets missing", async () => {
    const partial = { ...ENV, SESSION_SECRET: "" };
    const res = await handleRequest(req("/_t"), partial, fakeAEFetch({}));
    expect(res.status).toBe(503);
  });
});

describe("auth gate", () => {
  it("redirects HTML routes to /_t/login when not authed", async () => {
    const res = await handleRequest(req("/_t"), ENV, fakeAEFetch({}));
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe("/_t/login");
  });

  it("returns 401 JSON for API routes when not authed", async () => {
    const res = await handleRequest(req("/_t/api/hits"), ENV, fakeAEFetch({}));
    expect(res.status).toBe(401);
    const body = await res.json() as any;
    expect(body.error).toBe("unauthorized");
  });

  it("allows API access with a valid session cookie", async () => {
    const cookie = await validSessionCookie(ENV);
    const res = await handleRequest(
      req("/_t/api/hits", { headers: { cookie } }),
      ENV,
      fakeAEFetch({ rows: 0, data: [] }),
    );
    expect(res.status).toBe(200);
  });

  it("rejects an expired session cookie", async () => {
    const cookie = await validSessionCookie(ENV, Math.floor(Date.now() / 1000) - 60);
    const res = await handleRequest(
      req("/_t/api/hits", { headers: { cookie } }),
      ENV,
      fakeAEFetch({}),
    );
    expect(res.status).toBe(401);
  });

  it("rejects a tampered session cookie", async () => {
    const valid = await validSessionCookie(ENV);
    const tampered = valid.replace(/.$/, "X");
    const res = await handleRequest(
      req("/_t/api/hits", { headers: { cookie: tampered } }),
      ENV,
      fakeAEFetch({}),
    );
    expect(res.status).toBe(401);
  });

  it("still accepts Basic Auth as a fallback (for scripts/curl)", async () => {
    const res = await handleRequest(
      req("/_t/api/hits", { headers: { authorization: basicAuth("alice", "s3cret") } }),
      ENV,
      fakeAEFetch({ rows: 0, data: [] }),
    );
    expect(res.status).toBe(200);
  });
});

describe("login form", () => {
  it("serves the login HTML on GET /_t/login", async () => {
    const res = await handleRequest(req("/_t/login"), ENV, fakeAEFetch({}));
    expect(res.status).toBe(200);
    const body = await res.text();
    expect(body).toMatch(/<form method="POST" action="\/_t\/login"/);
    expect(body).toMatch(/autocomplete="username"/);
    expect(body).toMatch(/autocomplete="current-password"/);
  });

  it("shows an error banner when ?error=1", async () => {
    const res = await handleRequest(req("/_t/login?error=1"), ENV, fakeAEFetch({}));
    const body = await res.text();
    expect(body).toMatch(/Invalid username or password/);
  });

  it("rejects bad creds and redirects with ?error=1", async () => {
    const body = new URLSearchParams({ username: "alice", password: "wrong" });
    const res = await handleRequest(
      req("/_t/login", {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: body.toString(),
      }),
      ENV,
      fakeAEFetch({}),
    );
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe("/_t/login?error=1");
    expect(res.headers.get("set-cookie")).toBeNull();
  });

  it("accepts good creds, sets a cookie, redirects to /_t", async () => {
    const body = new URLSearchParams({ username: "alice", password: "s3cret" });
    const res = await handleRequest(
      req("/_t/login", {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: body.toString(),
      }),
      ENV,
      fakeAEFetch({}),
    );
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe("/_t");
    const cookie = res.headers.get("set-cookie") ?? "";
    expect(cookie).toMatch(/^luthien_dash=/);
    expect(cookie).toMatch(/HttpOnly/);
    expect(cookie).toMatch(/Secure/);
    expect(cookie).toMatch(/SameSite=Strict/);
    expect(cookie).toMatch(/Path=\/_t/);
  });

  it("rejects non-form-encoded login posts", async () => {
    const res = await handleRequest(
      req("/_t/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: '{"username":"alice","password":"s3cret"}',
      }),
      ENV,
      fakeAEFetch({}),
    );
    expect(res.status).toBe(400);
  });
});

describe("logout", () => {
  it("clears the cookie and redirects to /_t/login", async () => {
    const res = await handleRequest(
      req("/_t/logout", { method: "POST" }),
      ENV,
      fakeAEFetch({}),
    );
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe("/_t/login");
    expect(res.headers.get("set-cookie")).toMatch(/luthien_dash=;.*Max-Age=0/s);
  });
});

describe("HTML route", () => {
  it("serves the dashboard on /_t when authed", async () => {
    const cookie = await validSessionCookie(ENV);
    const res = await handleRequest(
      req("/_t", { headers: { cookie } }),
      ENV,
      fakeAEFetch({}),
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toMatch(/text\/html/);
    const body = await res.text();
    expect(body).toMatch(/luthien.cc tracker/);
    expect(body).toMatch(/Sign out/);
  });
});

describe("/_t/api/hits", () => {
  it("returns summary data when no ref param", async () => {
    const cookie = await validSessionCookie(ENV);
    const aeJson = { rows: 2, data: [{ ref: "a", hits: "5" }, { ref: "b", hits: "3" }] };
    const f = fakeAEFetch(aeJson);
    const res = await handleRequest(
      req("/_t/api/hits", { headers: { cookie } }),
      ENV,
      f,
    );
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.rows).toBe(2);
    const sentSql = (f as any).mock.calls[0][1].body as string;
    expect(sentSql).toMatch(/GROUP BY blob1/);
    expect(sentSql).not.toMatch(/blob1 = '/);
  });

  it("returns drill-down rows when ref param is set", async () => {
    const cookie = await validSessionCookie(ENV);
    const f = fakeAEFetch({ rows: 1, data: [] });
    const res = await handleRequest(
      req("/_t/api/hits?ref=alice-2026-05", { headers: { cookie } }),
      ENV,
      f,
    );
    expect(res.status).toBe(200);
    const sentSql = (f as any).mock.calls[0][1].body as string;
    expect(sentSql).toMatch(/blob1 = 'alice-2026-05'/);
    expect(sentSql).toMatch(/ORDER BY hit_time DESC/);
  });

  it("sanitises the ref parameter before injecting into SQL", async () => {
    const cookie = await validSessionCookie(ENV);
    const f = fakeAEFetch({ rows: 0, data: [] });
    await handleRequest(
      req("/_t/api/hits?ref=" + encodeURIComponent("evil'; DROP TABLE; --"), {
        headers: { cookie },
      }),
      ENV,
      f,
    );
    const sentSql = (f as any).mock.calls[0][1].body as string;
    // Quote, semicolon, space all stripped. The two remaining hyphens were
    // adjacent in the input and get collapsed to a single hyphen so we don't
    // end up with `--` (SQL line comment) inside the literal.
    expect(sentSql).not.toMatch(/DROP TABLE/);
    expect(sentSql).not.toMatch(/--/);
    expect(sentSql).toMatch(/blob1 = 'evilDROPTABLE-'/);
  });

  it("clamps days to a reasonable range", async () => {
    const cookie = await validSessionCookie(ENV);
    const f = fakeAEFetch({ rows: 0, data: [] });
    await handleRequest(
      req("/_t/api/hits?days=99999", { headers: { cookie } }),
      ENV,
      f,
    );
    expect((f as any).mock.calls[0][1].body).toMatch(/INTERVAL '365' DAY/);

    const f2 = fakeAEFetch({ rows: 0, data: [] });
    await handleRequest(
      req("/_t/api/hits?days=garbage", { headers: { cookie } }),
      ENV,
      f2,
    );
    expect((f2 as any).mock.calls[0][1].body).toMatch(/INTERVAL '30' DAY/);
  });

  it("returns 502 when AE responds non-2xx", async () => {
    const cookie = await validSessionCookie(ENV);
    const res = await handleRequest(
      req("/_t/api/hits", { headers: { cookie } }),
      ENV,
      fakeAEFetch({ errors: ["boom"] }, false),
    );
    expect(res.status).toBe(502);
  });
});

describe("not found", () => {
  it("returns 404 for unknown paths under /_t when authed", async () => {
    const cookie = await validSessionCookie(ENV);
    const res = await handleRequest(
      req("/_t/nope", { headers: { cookie } }),
      ENV,
      fakeAEFetch({}),
    );
    expect(res.status).toBe(404);
  });
});
