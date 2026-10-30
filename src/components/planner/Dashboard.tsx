import { useState } from 'react';
import { CalendarDays, MapPin, Plus, Trash2, Users } from 'lucide-react';
import { usePlanner, sortedTrips } from '../../lib/planner/store';
import type { SyncStatus } from '../../lib/planner/sync';
import { tripDateRange } from '../../lib/planner/types';
import NewTripDialog from './NewTripDialog';
import { EmptyNote, SyncBadge, useDestinations } from './ui';

type Props = {
  status: SyncStatus;
  signedIn: boolean;
  /** Destination passed in with ?add= from a destination page. */
  addId: string | null;
  missingTrip: boolean;
  onOpen: (tripId: string) => void;
};

export default function Dashboard({ status, signedIn, addId, missingTrip, onOpen }: Props) {
  const tripsById = usePlanner((s) => s.trips);
  const deleteTrip = usePlanner((s) => s.deleteTrip);
  const addStop = usePlanner((s) => s.addStop);
  const destinations = useDestinations();
  const [creating, setCreating] = useState(false);
  const [presetId, setPresetId] = useState<string | null>(null);

  const trips = sortedTrips(tripsById);
  const adding = addId ? destinations.get(addId) : undefined;

  function startNew(withId: string | null) {
    setPresetId(withId);
    setCreating(true);
  }

  return (
    <div>
      <div className="flex flex-col gap-6 border-b border-line pb-8 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="eyebrow">Trip planner</p>
          <h1 className="mt-4 font-display text-5xl leading-tight md:text-6xl">
            Your <em className="text-accent">trips</em>
          </h1>
          <div className="mt-4">
            <SyncBadge status={status} />
          </div>
        </div>
        <button type="button" className="btn-dark self-start md:self-auto" onClick={() => startNew(null)}>
          <Plus className="size-4" aria-hidden="true" /> New trip
        </button>
      </div>

      {!signedIn && (
        <p className="mt-6 rounded-2xl bg-sage-soft px-5 py-4 text-sm">
          You’re planning as a guest, so trips are saved in this browser only.{' '}
          <a href="/login?next=/planner" className="font-medium underline underline-offset-4">
            Log in
          </a>{' '}
          to keep them across devices. Your trips come with you.
        </p>
      )}

      {missingTrip && (
        <p className="mt-6 rounded-2xl border border-line px-5 py-4 text-sm text-ink-soft" role="alert">
          We couldn’t find that trip. It may have been deleted, or saved on another device.
        </p>
      )}

      {adding && (
        <section className="mt-8 rounded-3xl bg-card p-6 shadow-soft" aria-labelledby="add-heading">
          <div className="flex items-center gap-4">
            <img src={adding.image.src} alt="" className="size-16 rounded-2xl object-cover" />
            <div>
              <h2 id="add-heading" className="font-display text-2xl">
                Add {adding.name} to a trip
              </h2>
              <p className="text-sm text-ink-soft">
                We’ll add {adding.daysNeeded.min} {adding.daysNeeded.min === 1 ? 'day' : 'days'} based there. You can change it after.
              </p>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {trips.map((t) => (
              <button
                key={t.id}
                type="button"
                className="btn-outline py-2"
                onClick={() => {
                  addStop(t.id, adding.id, adding.daysNeeded.min);
                  onOpen(t.id);
                }}
              >
                Add to “{t.title}”
              </button>
            ))}
            <button type="button" className="btn-sage py-2" onClick={() => startNew(adding.id)}>
              <Plus className="size-4" aria-hidden="true" /> Start a new trip
            </button>
          </div>
        </section>
      )}

      <div className="mt-10">
        {trips.length === 0 ? (
          <EmptyNote>
            No trips yet. Start one here, or browse <a href="/destinations" className="underline underline-offset-4">destinations</a>{' '}
            and press “Add to a trip”.
          </EmptyNote>
        ) : (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {trips.map((t) => {
              const places = t.destinationIds.map((id) => destinations.get(id)).filter((d) => d !== undefined);
              const cover = places[0];
              const range = tripDateRange(t);
              return (
                <li key={t.id} className="group relative overflow-hidden rounded-3xl bg-card shadow-soft">
                  <div className="aspect-[16/9] bg-sage-soft">
                    {cover && <img src={cover.image.src} alt="" className="size-full object-cover" />}
                  </div>
                  <div className="p-5">
                    <h2 className="font-display text-2xl">
                      <button type="button" onClick={() => onOpen(t.id)} className="text-left after:absolute after:inset-0 group-hover:text-accent">
                        {t.title}
                      </button>
                    </h2>
                    <ul className="mt-3 space-y-1.5 text-sm text-ink-soft">
                      <li className="flex items-center gap-2">
                        <CalendarDays className="size-4" aria-hidden="true" />
                        {t.days.length} {t.days.length === 1 ? 'day' : 'days'}
                        {range && ` · ${range}`}
                      </li>
                      <li className="flex items-center gap-2">
                        <Users className="size-4" aria-hidden="true" />
                        {t.travellers} {t.travellers === 1 ? 'traveller' : 'travellers'}
                      </li>
                      {places.length > 0 && (
                        <li className="flex items-center gap-2">
                          <MapPin className="size-4" aria-hidden="true" />
                          {places.map((p) => p.name).join(', ')}
                        </li>
                      )}
                    </ul>
                  </div>
                  <button
                    type="button"
                    aria-label={`Delete ${t.title}`}
                    className="absolute top-3 right-3 z-10 grid size-9 place-items-center rounded-full bg-card/90 text-ink-soft opacity-0 shadow-soft transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 hover:text-red-700 focus-visible:opacity-100"
                    onClick={() => {
                      if (confirm(`Delete “${t.title}”? This can’t be undone.`)) deleteTrip(t.id);
                    }}
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <NewTripDialog
        open={creating}
        presetId={presetId}
        onClose={() => setCreating(false)}
        onCreated={(id) => {
          setCreating(false);
          onOpen(id);
        }}
      />
    </div>
  );
}
