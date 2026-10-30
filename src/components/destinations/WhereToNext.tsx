import { useState } from 'react';
import { matches, MONTHS, type DestinationCard, type Vibe } from '../../lib/destinations';
import Card from './Card';
import Filters from './Filters';

/** Home-page picker: choose a month and a mood, get up to three suggestions. */
export default function WhereToNext({ destinations }: { destinations: DestinationCard[] }) {
  const [month, setMonth] = useState<number | null>(() => new Date().getMonth() + 1);
  const [vibe, setVibe] = useState<Vibe | null>(null);

  const results = destinations.filter((d) => matches(d, month, vibe));
  const shown = results.slice(0, 3);

  const params = new URLSearchParams();
  if (month) params.set('month', String(month));
  if (vibe) params.set('vibe', vibe);

  return (
    <div>
      <Filters month={month} vibe={vibe} onMonth={setMonth} onVibe={setVibe} />

      <p className="mt-10 text-sm text-ink-soft" aria-live="polite">
        {results.length === 0
          ? 'Nothing fits that combination. Try another month or mood.'
          : `${results.length} ${results.length === 1 ? 'place' : 'places'} worth it${month ? ` in ${MONTHS[month - 1]}` : ''}.`}
      </p>

      {shown.length > 0 && (
        <div className="mt-6 grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((d) => (
            <Card key={d.id} d={d} />
          ))}
        </div>
      )}

      {results.length > shown.length && (
        <a
          href={`/destinations?${params}`}
          className="mt-10 inline-block text-sm underline underline-offset-4 hover:text-accent"
        >
          See all {results.length}
        </a>
      )}
    </div>
  );
}
