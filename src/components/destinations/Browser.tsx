import { useEffect, useState } from 'react';
import { matches, type DestinationCard, type Vibe } from '../../lib/destinations';
import Card from './Card';
import Filters from './Filters';

type Props = {
  destinations: DestinationCard[];
  initialMonth: number | null;
  initialVibe: Vibe | null;
};

/** Full destinations grid. Filters are mirrored into the URL so a filtered view can be shared. */
export default function Browser({ destinations, initialMonth, initialVibe }: Props) {
  const [month, setMonth] = useState(initialMonth);
  const [vibe, setVibe] = useState(initialVibe);

  useEffect(() => {
    const params = new URLSearchParams();
    if (month) params.set('month', String(month));
    if (vibe) params.set('vibe', vibe);
    const query = params.toString();
    history.replaceState(null, '', query ? `?${query}` : location.pathname);
  }, [month, vibe]);

  const results = destinations.filter((d) => matches(d, month, vibe));

  return (
    <div>
      <Filters month={month} vibe={vibe} onMonth={setMonth} onVibe={setVibe} />

      <div className="mt-10 flex items-baseline justify-between border-b border-ink pb-3">
        <p aria-live="polite">
          {results.length} of {destinations.length} places
        </p>
        {(month || vibe) && (
          <button
            type="button"
            onClick={() => {
              setMonth(null);
              setVibe(null);
            }}
            className="text-sm underline underline-offset-4 hover:text-accent"
          >
            Clear filters
          </button>
        )}
      </div>

      {results.length === 0 ? (
        <p className="py-16 text-center text-ink-soft">Nothing matches yet. Try a different month or mood.</p>
      ) : (
        <div className="mt-10 grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((d, i) => (
            <Card key={d.id} d={d} eager={i < 3} />
          ))}
        </div>
      )}
    </div>
  );
}
