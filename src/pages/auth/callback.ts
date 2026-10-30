import type { APIRoute } from 'astro';
import type { EmailOtpType } from '@supabase/supabase-js';
import { safeNext } from '../../lib/supabase';

// Landing point for Google sign-in, magic links, signup confirmation and password reset emails.
export const GET: APIRoute = async ({ url, locals, redirect }) => {
  const next = safeNext(url.searchParams.get('next'));
  const code = url.searchParams.get('code');
  const tokenHash = url.searchParams.get('token_hash');
  const type = url.searchParams.get('type') as EmailOtpType | null;

  if (!locals.supabase) return redirect('/login?error=not-configured');

  const { error } = code
    ? await locals.supabase.auth.exchangeCodeForSession(code)
    : tokenHash && type
      ? await locals.supabase.auth.verifyOtp({ token_hash: tokenHash, type })
      : { error: new Error('missing code') };

  if (error) return redirect('/login?error=link-expired');
  return redirect(next);
};
