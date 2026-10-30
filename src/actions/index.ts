import { ActionError, defineAction, type ActionAPIContext } from 'astro:actions';
import { z } from 'astro/zod';
import { safeNext } from '../lib/supabase';
import { trips } from './trips';

// Astro sends empty form fields as null, so each required field sets its own "missing" message.
const required = (message: string) => z.string({ error: message }).trim().min(1, message);

const email = z.email('Enter a valid email address');
const newPassword = z
  .string({ error: 'Choose a password' })
  .min(8, 'Use at least 8 characters')
  .max(72, 'Use 72 characters or fewer');

function getSupabase(context: ActionAPIContext) {
  const supabase = context.locals.supabase;
  if (!supabase) {
    throw new ActionError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Sign-in is not set up yet. Add your Supabase keys to .env and restart the dev server.',
    });
  }
  return supabase;
}

/** Where Supabase sends people back to after an email link or Google sign-in. */
function callbackUrl(context: ActionAPIContext, next: string) {
  return `${context.url.origin}/auth/callback?next=${encodeURIComponent(next)}`;
}

export const server = {
  trips,
  auth: {
    login: defineAction({
      accept: 'form',
      input: z.object({
        email,
        password: z.string({ error: 'Enter your password' }).min(1, 'Enter your password'),
        next: z.string().optional(),
      }),
      handler: async (input, context) => {
        const { error } = await getSupabase(context).auth.signInWithPassword({
          email: input.email,
          password: input.password,
        });
        if (error) {
          throw new ActionError({ code: 'UNAUTHORIZED', message: 'That email and password don’t match.' });
        }
        return { redirectTo: safeNext(input.next) };
      },
    }),

    magicLink: defineAction({
      accept: 'form',
      input: z.object({ email, next: z.string().optional() }),
      handler: async (input, context) => {
        const { error } = await getSupabase(context).auth.signInWithOtp({
          email: input.email,
          options: { emailRedirectTo: callbackUrl(context, safeNext(input.next)) },
        });
        if (error) throw new ActionError({ code: 'BAD_REQUEST', message: error.message });
        return { sentTo: input.email };
      },
    }),

    google: defineAction({
      accept: 'form',
      input: z.object({ next: z.string().optional() }),
      handler: async (input, context) => {
        const { data, error } = await getSupabase(context).auth.signInWithOAuth({
          provider: 'google',
          options: { redirectTo: callbackUrl(context, safeNext(input.next)) },
        });
        if (error || !data.url) {
          throw new ActionError({
            code: 'BAD_REQUEST',
            message: error?.message ?? 'Google sign-in is not available right now.',
          });
        }
        return { url: data.url };
      },
    }),

    signup: defineAction({
      accept: 'form',
      input: z.object({
        name: required('Tell us what to call you').max(80),
        email,
        password: newPassword,
      }),
      handler: async (input, context) => {
        const { data, error } = await getSupabase(context).auth.signUp({
          email: input.email,
          password: input.password,
          options: {
            data: { full_name: input.name },
            emailRedirectTo: callbackUrl(context, '/account'),
          },
        });
        if (error) throw new ActionError({ code: 'BAD_REQUEST', message: error.message });
        // With email confirmation on (the Supabase default) there is no session until they click the link.
        return { needsConfirmation: !data.session, email: input.email };
      },
    }),

    requestReset: defineAction({
      accept: 'form',
      input: z.object({ email }),
      handler: async (input, context) => {
        const { error } = await getSupabase(context).auth.resetPasswordForEmail(input.email, {
          redirectTo: callbackUrl(context, '/reset-password'),
        });
        if (error) throw new ActionError({ code: 'BAD_REQUEST', message: error.message });
        return { sentTo: input.email };
      },
    }),

    updatePassword: defineAction({
      accept: 'form',
      input: z
        .object({ password: newPassword, confirm: z.string({ error: 'Type the password again' }) })
        .refine((v) => v.password === v.confirm, { path: ['confirm'], message: 'Passwords don’t match' }),
      handler: async (input, context) => {
        if (!context.locals.user) {
          throw new ActionError({ code: 'UNAUTHORIZED', message: 'Your reset link has expired. Request a new one.' });
        }
        const { error } = await getSupabase(context).auth.updateUser({ password: input.password });
        if (error) throw new ActionError({ code: 'BAD_REQUEST', message: error.message });
        return { redirectTo: '/account' };
      },
    }),
  },
};
