import { defineMiddleware } from 'astro:middleware';
import { createSupabase } from './lib/supabase';

// The planner stays open to guests (trips are kept in localStorage until they sign up).
const PROTECTED = ['/account', '/reset-password'];

export const onRequest = defineMiddleware(async (context, next) => {
  const supabase = createSupabase(context.request, context.cookies);
  context.locals.supabase = supabase;
  context.locals.user = null;

  if (supabase) {
    // getUser() checks the token with Supabase instead of trusting the cookie.
    const { data } = await supabase.auth.getUser();
    context.locals.user = data.user;
  }

  const path = context.url.pathname;
  const isProtected = PROTECTED.some((p) => path === p || path.startsWith(`${p}/`));
  if (isProtected && !context.locals.user) {
    return context.redirect(`/login?next=${encodeURIComponent(path)}`);
  }

  return next();
});
