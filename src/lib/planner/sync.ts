import { useEffect, useState } from 'react';
import { actions } from 'astro:actions';
import { usePlanner } from './store';
import type { Trip } from './types';

export type SyncStatus = 'device' | 'loading' | 'saving' | 'saved' | 'not-set-up' | 'error';

/**
 * Keeps the local planner store in step with the signed-in user's trips in Supabase.
 * Guests keep everything in localStorage; on first sign-in their trips move into the account.
 */
export function useCloudSync(userId: string | null): SyncStatus {
  const [status, setStatus] = useState<SyncStatus>(userId ? 'loading' : 'device');

  useEffect(() => {
    const store = usePlanner;

    if (!userId) {
      // Signed out: trips that belonged to an account shouldn't stay on a shared device.
      if (store.getState().ownerId) store.getState().replaceAll([], null);
      setStatus('device');
      return;
    }

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let unsubscribe = () => {};
    // Last updatedAt we know the cloud has, per trip.
    const synced = new Map<string, number>();

    async function flush() {
      const { trips, pendingDeletes } = store.getState();
      const dirty = Object.values(trips).filter((t) => synced.get(t.id) !== t.updatedAt);
      if (!dirty.length && !pendingDeletes.length) return;
      setStatus('saving');
      const [saved, removed] = await Promise.all([
        dirty.length ? actions.trips.save({ trips: dirty }) : null,
        pendingDeletes.length ? actions.trips.remove({ ids: pendingDeletes }) : null,
      ]);
      if (cancelled) return;
      const error = saved?.error ?? removed?.error;
      if (error) {
        setStatus(error.code === 'NOT_FOUND' ? 'not-set-up' : 'error');
        return;
      }
      dirty.forEach((t) => synced.set(t.id, t.updatedAt));
      store.getState().clearPendingDeletes(pendingDeletes);
      setStatus('saved');
    }

    (async () => {
      setStatus('loading');
      const { data, error } = await actions.trips.list();
      if (cancelled) return;
      if (error) {
        setStatus(error.code === 'NOT_FOUND' ? 'not-set-up' : 'error');
        return;
      }

      const remote = data as unknown as Trip[];
      remote.forEach((t) => synced.set(t.id, t.updatedAt));

      const { trips: local, ownerId } = store.getState();
      // Guest trips (no owner) or this user's own trips get merged; another account's are dropped.
      const mergeLocal = ownerId === null || ownerId === userId;
      const merged = new Map(remote.map((t) => [t.id, t]));
      if (mergeLocal) {
        for (const t of Object.values(local)) {
          const r = merged.get(t.id);
          if (!r || t.updatedAt > r.updatedAt) merged.set(t.id, t);
        }
      }
      store.getState().replaceAll([...merged.values()], userId);
      setStatus('saved');
      await flush();

      unsubscribe = store.subscribe(() => {
        clearTimeout(timer);
        timer = setTimeout(flush, 800);
      });
    })();

    return () => {
      cancelled = true;
      clearTimeout(timer);
      unsubscribe();
    };
  }, [userId]);

  return status;
}
