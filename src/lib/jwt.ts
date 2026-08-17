/**
 * Lightweight JWT utility using the Web Crypto API.
 * No additional dependencies required.
 */

const JWT_SECRET = process.env.JWT_SECRET ?? 'nib-legal-dev-secret-change-in-production-32chars';
const ALGORITHM = { name: 'HMAC', hash: 'SHA-256' };

// ── Helpers ──────────────────────────────────────────────────────────────────

function b64url(data: ArrayBuffer | Uint8Array): string {
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
  let str = '';
  for (const b of bytes) str += String.fromCharCode(b);
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function fromB64url(str: string): Uint8Array<ArrayBuffer> {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(padded);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

async function getCryptoKey(usage: KeyUsage[]): Promise<CryptoKey> {
  const raw = new TextEncoder().encode(JWT_SECRET);
  return crypto.subtle.importKey('raw', raw, ALGORITHM, false, usage);
}

// ── Public API ────────────────────────────────────────────────────────────────

export interface JwtPayload {
  sub: string;        // userId
  email: string;
  role: string;
  iat: number;
  exp: number;
  jti: string;        // unique token id (for revocation if needed)
}

export async function signJwt(
  payload: Omit<JwtPayload, 'iat' | 'exp' | 'jti'>,
  expiresInSeconds = 28800, // 8 hours default
): Promise<string> {
  const header = b64url(new TextEncoder().encode(JSON.stringify({ alg: 'HS256', typ: 'JWT' })));
  const now = Math.floor(Date.now() / 1000);
  const body = b64url(
    new TextEncoder().encode(
      JSON.stringify({
        ...payload,
        iat: now,
        exp: now + expiresInSeconds,
        jti: crypto.randomUUID(),
      }),
    ),
  );
  const key = await getCryptoKey(['sign']);
  const sig = await crypto.subtle.sign(ALGORITHM, key, new TextEncoder().encode(`${header}.${body}`));
  return `${header}.${body}.${b64url(sig)}`;
}

export async function verifyJwt(token: string): Promise<JwtPayload | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, body, signature] = parts;
    const key = await getCryptoKey(['verify']);
    const valid = await crypto.subtle.verify(
      ALGORITHM,
      key,
      fromB64url(signature),
      new TextEncoder().encode(`${header}.${body}`),
    );
    if (!valid) return null;
    const payload: JwtPayload = JSON.parse(new TextDecoder().decode(fromB64url(body)));
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}
