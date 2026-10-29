import { createServerClient, parseCookieHeader } from '@supabase/ssr';
import type { AstroCookies } from 'astro';

const url = import.meta.env.PUBLIC_SUPABASE_URL;
const key = import.meta.env.PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const isSupabaseConfigured = Boolean(url && key);

/** A per-request Supabase client that reads and writes the auth cookies. */
export function createSupabase(request: Request, cookies: AstroCookies) {
  if (!url || !key) return null;

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return parseCookieHeader(request.headers.get('Cookie') ?? '');
      },
      setAll(cookiesToSet) {
        for (const { name, value, options } of cookiesToSet) {
          cookies.set(name, value, options);
        }
      },
    },
  });
}

/** Only allow same-site relative redirects, so ?next= can't send people elsewhere. */
export function safeNext(next: string | null | undefined, fallback = '/account') {
  // Browsers drop tabs/newlines and treat "\" as "/", so "/\t/evil.com" would become "//evil.com".
  if (!next || /[\u0000-\u001F\\]/.test(next) || !next.startsWith('/') || next.startsWith('//')) {
    return fallback;
  }
  try {
    const base = 'http://local.invalid';
    const url = new URL(next, base);
    if (url.origin !== base) return fallback;
    return url.pathname + url.search + url.hash;
  } catch {
    return fallback;
  }
}
