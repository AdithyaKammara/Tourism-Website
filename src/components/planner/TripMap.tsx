import { lazy, Suspense, useMemo } from 'react';
import type { Trip } from '../../lib/planner/types';
import { EmptyNote, useDestinations } from './ui';

const MapView = lazy(() => import('../destinations/MapView'));

/** The trip's bases in order, numbered, with a line between them. */
export default function TripMap({ trip }: { trip: Trip }) {
  const destinations = useDestinations();

  const stops = useMemo(() => {
    const list: { id: string; first: number; last: number }[] = [];
    trip.days.forEach((day, i) => {
      if (!day.destinationId) return;
      const prev = list.at(-1);
      if (prev && prev.id === day.destinationId && prev.last === i - 1) prev.last = i;
      else list.push({ id: day.destinationId, first: i, last: i });
    });
    return list.flatMap((s, n) => {
      const d = destinations.get(s.id);
      if (!d) return [];
      const days = s.first === s.last ? `Day ${s.first + 1}` : `Days ${s.first + 1}–${s.last + 1}`;
      return [{ id: d.id, name: d.name, lat: d.coordinates.lat, lng: d.coordinates.lng, label: String(n + 1), note: days }];
    });
  }, [trip.days, destinations]);

  if (stops.length === 0) {
    return <EmptyNote>Set where you’re based on each day in the itinerary to see your route here.</EmptyNote>;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-12">
      <div className="h-[60vh] min-h-96 overflow-hidden rounded-panel lg:col-span-8">
        <Suspense fallback={<div className="size-full animate-pulse bg-sage-soft" />}>
          <MapView points={stops} route ariaLabel={`Route map for ${trip.title}`} />
        </Suspense>
      </div>
      <ol className="space-y-3 lg:col-span-4">
        {stops.map((s) => (
          <li key={`${s.label}-${s.id}`} className="flex items-center gap-3 rounded-2xl bg-card p-4 shadow-soft">
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-moss text-sm font-semibold text-cream dark:text-forest">{s.label}</span>
            <span>
              <a href={`/destinations/${s.id}`} className="font-medium hover:text-accent">
                {s.name}
              </a>
              <span className="block text-xs text-ink-soft">{s.note}</span>
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
