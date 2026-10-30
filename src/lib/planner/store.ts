import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { newDay, uid, type Trip } from './types';

type NewTrip = Pick<Trip, 'title' | 'travellers'> & Partial<Pick<Trip, 'startDate' | 'budget' | 'packing'>> & {
  /** Each destination with how many days to spend there. */
  stops: { destinationId: string; days: number }[];
};

type PlannerState = {
  trips: Record<string, Trip>;
  /** Signed-in user these trips belong to; null while they're a guest's. */
  ownerId: string | null;
  /** Trips deleted locally that still need deleting in the cloud. */
  pendingDeletes: string[];

  createTrip: (input: NewTrip) => string;
  updateTrip: (id: string, change: (trip: Trip) => void) => void;
  deleteTrip: (id: string) => void;
  addStop: (id: string, destinationId: string, days: number) => void;
  /** Replace everything with what the cloud has (used when syncing). */
  replaceAll: (trips: Trip[], ownerId: string | null) => void;
  clearPendingDeletes: (ids: string[]) => void;
};

export const usePlanner = create<PlannerState>()(
  persist(
    immer((set) => ({
      trips: {},
      ownerId: null,
      pendingDeletes: [],

      createTrip: ({ stops, ...input }) => {
        const id = uid();
        const now = Date.now();
        set((s) => {
          s.trips[id] = {
            id,
            ...input,
            destinationIds: [...new Set(stops.map((st) => st.destinationId))],
            days: stops.length
              ? stops.flatMap((st) => Array.from({ length: Math.max(1, st.days) }, () => newDay(st.destinationId)))
              : [newDay()],
            expenses: [],
            packing: input.packing ?? [],
            bookings: [],
            createdAt: now,
            updatedAt: now,
          };
        });
        return id;
      },

      updateTrip: (id, change) =>
        set((s) => {
          const trip = s.trips[id];
          if (!trip) return;
          change(trip);
          trip.updatedAt = Date.now();
        }),

      deleteTrip: (id) =>
        set((s) => {
          delete s.trips[id];
          if (s.ownerId) s.pendingDeletes.push(id);
        }),

      addStop: (id, destinationId, days) =>
        set((s) => {
          const trip = s.trips[id];
          if (!trip) return;
          if (!trip.destinationIds.includes(destinationId)) trip.destinationIds.push(destinationId);
          // Fill an empty, unassigned trailing day first so a fresh trip doesn't start with a blank day.
          const last = trip.days.at(-1);
          let remaining = Math.max(1, days);
          if (last && !last.destinationId && last.items.length === 0) {
            last.destinationId = destinationId;
            remaining--;
          }
          for (let i = 0; i < remaining; i++) trip.days.push(newDay(destinationId));
          trip.updatedAt = Date.now();
        }),

      replaceAll: (trips, ownerId) =>
        set((s) => {
          s.trips = Object.fromEntries(trips.map((t) => [t.id, t]));
          s.ownerId = ownerId;
        }),

      clearPendingDeletes: (ids) =>
        set((s) => {
          s.pendingDeletes = s.pendingDeletes.filter((id) => !ids.includes(id));
        }),
    })),
    {
      // Storage key kept from the site's first name so existing guest trips aren't lost.
      name: 'goadi-planner',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: ({ trips, ownerId, pendingDeletes }) => ({ trips, ownerId, pendingDeletes }),
    },
  ),
);

export const sortedTrips = (trips: Record<string, Trip>) =>
  Object.values(trips).sort((a, b) => b.updatedAt - a.updatedAt);
