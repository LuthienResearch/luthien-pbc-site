// Cookie-based session auth. The session cookie is `<base64-json>.<base64-hmac>`,
// where the HMAC is computed over the JSON payload using SESSION_SECRET.
//
// We use HMAC-SHA256 via the Web Crypto API (native in Workers). No KV or
// D1 needed; sessions are stateless and self-validating, with an `exp`
// claim for expiry.

const COOKIE_NAME = "luthien_dash";
const SESSION_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 days

export interface SessionPayload {
  u: string; // username
  exp: number; // unix seconds
}

export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return mismatch === 0;
}

export function timingSafeEqualBytes(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) mismatch |= a[i] ^ b[i];
  return mismatch === 0;
}

function b64urlEncode(bytes: Uint8Array | string): string {
  const data = typeof bytes === "string" ? new TextEncoder().encode(bytes) : bytes;
  let bin = "";
  for (let i = 0; i < data.length; i++) bin += String.fromCharCode(data[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlDecode(str: string): Uint8Array {
  const padded = str.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(str.length / 4) * 4, "=");
  const bin = atob(padded);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function importKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

export async function signSession(payload: SessionPayload, secret: string): Promise<string> {
  const json = JSON.stringify(payload);
  const headerB64 = b64urlEncode(json);
  const key = await importKey(secret);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(headerB64));
  return `${headerB64}.${b64urlEncode(new Uint8Array(sig))}`;
}

export async function verifySession(
  cookie: string,
  secret: string,
  nowSeconds: number = Math.floor(Date.now() / 1000),
): Promise<SessionPayload | null> {
  const dot = cookie.indexOf(".");
  if (dot < 0) return null;
  const headerB64 = cookie.slice(0, dot);
  const sigB64 = cookie.slice(dot + 1);
  if (!headerB64 || !sigB64) return null;

  let providedSig: Uint8Array;
  try {
    providedSig = b64urlDecode(sigB64);
  } catch {
    return null;
  }

  const key = await importKey(secret);
  const expectedSig = new Uint8Array(
    await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(headerB64)),
  );
  if (!timingSafeEqualBytes(providedSig, expectedSig)) return null;

  let payload: SessionPayload;
  try {
    const json = new TextDecoder().decode(b64urlDecode(headerB64));
    payload = JSON.parse(json);
  } catch {
    return null;
  }

  if (typeof payload.u !== "string" || typeof payload.exp !== "number") return null;
  if (payload.exp <= nowSeconds) return null;
  return payload;
}

export function readSessionCookie(request: Request): string | null {
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name === COOKIE_NAME) return rest.join("=");
  }
  return null;
}

export function buildSessionCookie(value: string, maxAgeSeconds: number = SESSION_TTL_SECONDS): string {
  return [
    `${COOKIE_NAME}=${value}`,
    `Path=/_t`,
    `Max-Age=${maxAgeSeconds}`,
    `HttpOnly`,
    `Secure`,
    `SameSite=Strict`,
  ].join("; ");
}

export function clearSessionCookie(): string {
  return buildSessionCookie("", 0);
}

export { COOKIE_NAME, SESSION_TTL_SECONDS };
