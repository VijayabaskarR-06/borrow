const enc = new TextEncoder();
export function canonical(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  return `{${Object.keys(value as object).filter(k => (value as Record<string,unknown>)[k] !== undefined).sort().map(k => `${JSON.stringify(k)}:${canonical((value as Record<string,unknown>)[k])}`).join(',')}}`;
}
export function toBase64(bytes: ArrayBuffer | Uint8Array): string { let out=''; for (const n of new Uint8Array(bytes)) out += String.fromCharCode(n); return btoa(out); }
export function fromBase64(s: string): Uint8Array { return Uint8Array.from(atob(s), c => c.charCodeAt(0)); }
export function randomHex(size=32): string { return Array.from(crypto.getRandomValues(new Uint8Array(size)), n => n.toString(16).padStart(2,'0')).join(''); }
export async function sha256(value: string): Promise<string> { return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', enc.encode(value))), n => n.toString(16).padStart(2,'0')).join(''); }
export async function generateSigningKeys(): Promise<{publicKey: JsonWebKey; privateKey: JsonWebKey}> {
  const keys=await crypto.subtle.generateKey({name:'ECDSA',namedCurve:'P-256'},true,['sign','verify']);
  return {publicKey:await crypto.subtle.exportKey('jwk',keys.publicKey),privateKey:await crypto.subtle.exportKey('jwk',keys.privateKey)};
}
export async function sign(value: unknown, key: JsonWebKey): Promise<string> { const k=await crypto.subtle.importKey('jwk',key,{name:'ECDSA',namedCurve:'P-256'},false,['sign']); return toBase64(await crypto.subtle.sign({name:'ECDSA',hash:'SHA-256'},k,enc.encode(canonical(value)))); }
export async function verify(value: unknown, signature: string, key: JsonWebKey): Promise<boolean> { try { const k=await crypto.subtle.importKey('jwk',key,{name:'ECDSA',namedCurve:'P-256'},false,['verify']); return await crypto.subtle.verify({name:'ECDSA',hash:'SHA-256'},k,fromBase64(signature) as BufferSource,enc.encode(canonical(value))); } catch { return false; } }
async function aesKey(secret: string) { if(!/^[a-fA-F0-9]{64}$/.test(secret)) throw new Error('BORROW_MASTER_KEY must be 32 bytes encoded as 64 hex characters'); const bytes=Uint8Array.from(secret.match(/.{2}/g)!, h=>parseInt(h,16)); return crypto.subtle.importKey('raw',bytes,{name:'AES-GCM'},false,['encrypt','decrypt']); }
export async function encrypt(value: unknown, secret: string, context: string): Promise<string> { const iv=crypto.getRandomValues(new Uint8Array(12)); const cipher=await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:enc.encode(context)},await aesKey(secret),enc.encode(JSON.stringify(value))); return JSON.stringify({v:1,iv:toBase64(iv),data:toBase64(cipher)}); }
export async function decrypt<T>(payload: string, secret: string, context: string): Promise<T> { const p=JSON.parse(payload); if(p.v!==1) throw new Error('Unsupported encrypted record'); const plain=await crypto.subtle.decrypt({name:'AES-GCM',iv:fromBase64(p.iv) as BufferSource,additionalData:enc.encode(context)},await aesKey(secret),fromBase64(p.data) as BufferSource); return JSON.parse(new TextDecoder().decode(plain)) as T; }
