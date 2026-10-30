import { useState } from 'react';
import { BedDouble, Bus, Plane, Plus, Ticket, TrainFront, Trash2 } from 'lucide-react';
import { usePlanner } from '../../lib/planner/store';
import { BOOKING_KINDS, uid, type BookingKind, type Trip } from '../../lib/planner/types';
import { EmptyNote, Field, inputClass } from './ui';

const KIND: Record<BookingKind, { label: string; icon: typeof Plane }> = {
  stay: { label: 'Stay', icon: BedDouble },
  flight: { label: 'Flight', icon: Plane },
  train: { label: 'Train', icon: TrainFront },
  bus: { label: 'Bus', icon: Bus },
  activity: { label: 'Activity', icon: Ticket },
};

export default function Bookings({ trip }: { trip: Trip }) {
  const update = usePlanner((s) => s.updateTrip);
  const [kind, setKind] = useState<BookingKind>('stay');
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [ref, setRef] = useState('');
  const [note, setNote] = useState('');

  const sorted = [...trip.bookings].sort((a, b) => (a.date ?? '9999').localeCompare(b.date ?? '9999'));

  return (
    <div className="grid gap-8 lg:grid-cols-12">
      <form
        className="space-y-4 rounded-3xl bg-card p-6 shadow-soft lg:col-span-5"
        onSubmit={(e) => {
          e.preventDefault();
          if (!title.trim()) return;
          update(trip.id, (t) =>
            void t.bookings.push({
              id: uid(),
              kind,
              title: title.trim(),
              date: date || undefined,
              ref: ref.trim() || undefined,
              note: note.trim() || undefined,
            }),
          );
          setTitle('');
          setDate('');
          setRef('');
          setNote('');
        }}
      >
        <h3 className="font-display text-2xl">Add a booking</h3>
        <fieldset>
          <legend className="mb-1.5 text-xs font-medium text-ink-soft">Type</legend>
          <div className="flex flex-wrap gap-2">
            {BOOKING_KINDS.map((k) => {
              const Icon = KIND[k].icon;
              return (
                <button
                  key={k}
                  type="button"
                  aria-pressed={kind === k}
                  onClick={() => setKind(k)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-sm hover:border-ink aria-pressed:border-forest aria-pressed:bg-forest aria-pressed:text-cream dark:aria-pressed:bg-cream dark:aria-pressed:text-forest"
                >
                  <Icon className="size-4" aria-hidden="true" /> {KIND[k].label}
                </button>
              );
            })}
          </div>
        </fieldset>
        <Field label="What" placeholder="Tea Valley Homestay, Munnar" value={title} maxLength={120} onChange={(e) => setTitle(e.target.value)} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <Field label="Confirmation / PNR" value={ref} maxLength={60} onChange={(e) => setRef(e.target.value)} />
        </div>
        <div>
          <label htmlFor="booking-note" className="mb-1.5 block text-xs font-medium text-ink-soft">
            Notes
          </label>
          <textarea id="booking-note" rows={2} maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} className={inputClass.replace('rounded-full', 'rounded-2xl')} placeholder="Check-in after 2pm, pay balance on arrival" />
        </div>
        <button type="submit" className="btn-dark w-full" disabled={!title.trim()}>
          <Plus className="size-4" aria-hidden="true" /> Save booking
        </button>
        <p className="text-xs text-ink-soft">Don’t store card numbers or passwords here.</p>
      </form>

      <div className="lg:col-span-7">
        {sorted.length === 0 ? (
          <EmptyNote>Keep hotel, train and flight details here so they’re all in one place on the day.</EmptyNote>
        ) : (
          <ul className="space-y-3">
            {sorted.map((b) => {
              const Icon = KIND[b.kind].icon;
              return (
                <li key={b.id} className="flex gap-4 rounded-3xl bg-card p-5 shadow-soft">
                  <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-sage-soft text-moss">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-ink-soft">
                      {KIND[b.kind].label}
                      {b.date && ` · ${new Date(`${b.date}T00:00:00`).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}`}
                    </p>
                    <p className="font-medium">{b.title}</p>
                    {b.ref && (
                      <p className="mt-1 text-sm">
                        <span className="text-ink-soft">Ref </span>
                        <span className="font-mono tracking-wide select-all">{b.ref}</span>
                      </p>
                    )}
                    {b.note && <p className="mt-1 text-sm text-ink-soft">{b.note}</p>}
                  </div>
                  <button
                    type="button"
                    aria-label={`Remove ${b.title}`}
                    onClick={() => update(trip.id, (t) => void (t.bookings = t.bookings.filter((x) => x.id !== b.id)))}
                    className="grid size-8 shrink-0 place-items-center rounded-lg text-ink-soft hover:bg-paper-deep hover:text-red-700"
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
