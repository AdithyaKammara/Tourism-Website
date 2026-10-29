import type { APIRoute } from 'astro';

// POST only, so a stray link or prefetch can't sign someone out.
// Astro's origin check blocks cross-site form posts here.
export const POST: APIRoute = async ({ locals, redirect }) => {
  await locals.supabase?.auth.signOut();
  return redirect('/', 303);
};
