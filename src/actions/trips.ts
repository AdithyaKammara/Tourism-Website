import { ActionError, defineAction, type ActionAPIContext } from 'astro:actions';
import { z } from 'astro/zod';

const MAX_TRIP_BYTES = 200_000;

// Postgres "undefined table" / PostgREST "table not in schema cache".
const MISSING_TABLE = new Set(['42P01', 'PGRST205']);

function signedIn(context: ActionAPIContext) {
  const { supabase, user } = context.locals;
  if (!supabase || !user) throw new ActionError({ code: 'UNAUTHORIZED', message: 'Log in to save trips to your account.' });
  return { supabase, user };
}

function fail(error: { code?: string; message: string }): never {
  if (error.code && MISSING_TABLE.has(error.code)) {
    throw new ActionError({ code: 'NOT_FOUND', message: 'The trips table has not been created in Supabase yet.' });
  }
  throw new ActionError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
}

// Only the fields the server relies on are checked; the rest of the trip is stored as-is.
const tripShape = z.looseObject({
  id: z.uuid(),
  title: z.string().max(200),
  updatedAt: z.number(),
  days: z.array(z.unknown()),
});

export const trips = {
  list: defineAction({
    handler: async (_input, context) => {
      const { supabase } = signedIn(context);
      const { data, error } = await supabase.from('trips').select('data').order('updated_at', { ascending: false });
      if (error) fail(error);
      return data.map((row) => row.data as Record<string, unknown>);
    },
  }),

  save: defineAction({
    input: z.object({ trips: z.array(tripShape).max(50) }),
    handler: async (input, context) => {
      const { supabase, user } = signedIn(context);
      for (const trip of input.trips) {
        if (JSON.stringify(trip).length > MAX_TRIP_BYTES) {
          throw new ActionError({ code: 'BAD_REQUEST', message: `“${trip.title}” is too large to save.` });
        }
      }
      const rows = input.trips.map((trip) => ({
        id: trip.id,
        user_id: user.id,
        data: trip,
        updated_at: new Date(trip.updatedAt).toISOString(),
      }));
      if (rows.length) {
        const { error } = await supabase.from('trips').upsert(rows);
        if (error) fail(error);
      }
      return { saved: rows.length };
    },
  }),

  remove: defineAction({
    input: z.object({ ids: z.array(z.uuid()).max(50) }),
    handler: async (input, context) => {
      const { supabase } = signedIn(context);
      if (input.ids.length) {
        const { error } = await supabase.from('trips').delete().in('id', input.ids);
        if (error) fail(error);
      }
      return { removed: input.ids.length };
    },
  }),
};
