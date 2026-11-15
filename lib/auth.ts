const enc = new TextEncoder();
const SESSION_SECONDS = 7 * 24 * 60 * 60;
const HEX_SIGNATURE = /^[a-f0-9]{64}$/;
async function sessionKey(secret: string) {
  return crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}
async function signature(value: string, secret: string) {
  const bytes = new Uint8Array(await crypto.subtle.sign('HMAC', await sessionKey(secret), enc.encode(value)));
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}
async function validSignature(value: string, supplied: string, secret: string) {
  if (!HEX_SIGNATURE.test(supplied)) return false;
  const bytes = Uint8Array.from(supplied.match(/.{2}/g)!, h => parseInt(h, 16));
  return crypto.subtle.verify('HMAC', await sessionKey(secret), bytes, enc.encode(value));
}
export async function authenticate(request: Request, env: Record<string, unknown>): Promise<{ userId: string; cookie?: string } | null> {
  const url = new URL(request.url);
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  if (!local || env.BORROW_ALLOW_LOCAL_DEMO !== 'true') return null;
  const secret = String(env.BORROW_MASTER_KEY || '');
  if (!/^[a-fA-F0-9]{64}$/.test(secret)) return null;
  const value = request.headers.get('cookie')?.split(';').map(v => v.trim()).find(v => v.startsWith('borrow_session='))?.slice(15);
  const now = Math.floor(Date.now() / 1000);
  if (value) {
    const parts = value.split('.');
    if (parts.length === 3) {
      const [id, expiry, supplied] = parts;
      const expiresAt = Number(expiry);
      if (HEX_SIGNATURE.test(id) && /^[1-9][0-9]{9,10}$/.test(expiry)
        && Number.isSafeInteger(expiresAt) && expiresAt > now
        && await validSignature(`${id}.${expiry}`, supplied, secret)) {
        return { userId: 'demo-' + id };
      }
    }
  }
  // Missing, expired, tampered and legacy cookies receive a fresh demo identity.
  const id = Array.from(crypto.getRandomValues(new Uint8Array(32)), b => b.toString(16).padStart(2, '0')).join('');
  const payload = `${id}.${now + SESSION_SECONDS}`;
  return {
    userId: 'demo-' + id,
    cookie: `borrow_session=${payload}.${await signature(payload, secret)}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${SESSION_SECONDS}${url.protocol === 'https:' ? '; Secure' : ''}`,
  };
}
export function validateOrigin(request: Request, expectedOrigin = new URL(request.url).origin) {
  if (request.method === 'GET') return true;
  const origin = request.headers.get('origin');
  return request.headers.get('sec-fetch-site') !== 'cross-site' && (!origin || origin === expectedOrigin);
}
