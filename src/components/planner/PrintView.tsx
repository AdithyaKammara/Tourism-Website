import { dayLabel, formatINR, tripDateRange, type Trip } from '../../lib/planner/types';
import { useDestinations } from './ui';

/** A plain, ink-friendly version of the trip. Hidden on screen, shown only when printing. */
export default function PrintView({ trip }: { trip: Trip }) {
  const destinations = useDestinations();
  const range = tripDateRange(trip);
  const places = trip.destinationIds.map((id) => destinations.get(id)?.name).filter(Boolean);
  const bookings = [...trip.bookings].sort((a, b) => (a.date ?? '9999').localeCompare(b.date ?? '9999'));
  const toPack = trip.packing.filter((p) => !p.packed);

  return (
    <div className="hidden text-black print:block">
      <h1 className="font-display text-4xl">{trip.title}</h1>
      <p className="mt-1 text-sm">
        {trip.days.length} days{range && ` · ${range}`} · {trip.travellers} {trip.travellers === 1 ? 'traveller' : 'travellers'}
        {places.length > 0 && ` · ${places.join(', ')}`}
      </p>

      <h2 className="mt-8 border-b border-black pb-1 text-lg font-semibold">Itinerary</h2>
      {trip.days.map((day, i) => (
        <section key={day.id} className="mt-4 break-inside-avoid">
          <h3 className="font-semibold">
            {dayLabel(trip, i)}
            {day.destinationId && ` · ${destinations.get(day.destinationId)?.name ?? ''}`}
          </h3>
          {day.items.length === 0 ? (
            <p className="text-sm">Free day</p>
          ) : (
            <ul className="mt-1 text-sm">
              {day.items.map((it) => (
                <li key={it.id} className="flex gap-3">
                  <span className="w-12 shrink-0 tabular-nums">{it.time ?? ''}</span>
                  <span className="flex-1">{it.title}</span>
                  {it.cost ? <span>{formatINR(it.cost)}</span> : null}
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}

      {bookings.length > 0 && (
        <section className="mt-8 break-inside-avoid">
          <h2 className="border-b border-black pb-1 text-lg font-semibold">Bookings</h2>
          <ul className="mt-2 space-y-1 text-sm">
            {bookings.map((b) => (
              <li key={b.id}>
                <strong>{b.kind[0].toUpperCase() + b.kind.slice(1)}</strong>
                {b.date && ` · ${new Date(`${b.date}T00:00:00`).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}`}: {b.title}
                {b.ref && ` · Ref ${b.ref}`}
                {b.note && ` · ${b.note}`}
              </li>
            ))}
          </ul>
        </section>
      )}

      {toPack.length > 0 && (
        <section className="mt-8 break-inside-avoid">
          <h2 className="border-b border-black pb-1 text-lg font-semibold">Still to pack</h2>
          <ul className="mt-2 columns-2 text-sm">
            {toPack.map((p) => (
              <li key={p.id}>☐ {p.label}</li>
            ))}
          </ul>
        </section>
      )}

      <p className="mt-10 text-xs">Planned with Goadi. Budgets are rough estimates.</p>
    </div>
  );
}
