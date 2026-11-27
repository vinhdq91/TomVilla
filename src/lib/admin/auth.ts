// Owner login for /admin. The password is the ADMIN_PASSWORD secret
// (Cloudflare → Worker → Settings → Variables and Secrets; `.env` on this computer).
// After login the browser keeps a signed cookie; changing the password logs everyone out.
import type { AstroCookies } from 'astro';
import { getSecret } from 'astro:env/server';

export const SESSION_COOKIE = 'tv_admin';
const SESSION_DAYS = 30;
const encoder = new TextEncoder();

const getPassword = () => getSecret('ADMIN_PASSWORD') || '';

async function sha256(text: string) {
  return new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(text)));
}

async function sign(payload: string) {
  const key = await crypto.subtle.importKey('raw', await sha256('tomvilla-admin:' + getPassword()), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(payload)));
  return btoa(String.fromCharCode(...sig)).replace(/[+/=]/g, (c) => ({ '+': '-', '/': '_', '=': '' })[c]!);
}

/** Compares in constant time so the password can't be guessed by timing. */
function sameBytes(a: Uint8Array, b: Uint8Array) {
  let diff = a.length ^ b.length;
  for (let i = 0; i < Math.min(a.length, b.length); i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

export const isPasswordSet = () => getPassword().length >= 8;

export async function checkPassword(input: string) {
  if (!isPasswordSet()) return false;
  return sameBytes(await sha256(input), await sha256(getPassword()));
}

export async function startSession(cookies: AstroCookies, secure: boolean) {
  const expires = Date.now() + SESSION_DAYS * 86_400_000;
  const value = `${expires}.${await sign(String(expires))}`;
  cookies.set(SESSION_COOKIE, value, { path: '/', httpOnly: true, secure, sameSite: 'strict', expires: new Date(expires) });
}

export async function hasSession(cookies: AstroCookies) {
  const value = cookies.get(SESSION_COOKIE)?.value;
  if (!value || !isPasswordSet()) return false;
  const [expires, sig] = value.split('.');
  if (!expires || !sig || Number(expires) < Date.now()) return false;
  return sameBytes(encoder.encode(sig), encoder.encode(await sign(expires)));
}

export function endSession(cookies: AstroCookies) {
  cookies.delete(SESSION_COOKIE, { path: '/' });
}
