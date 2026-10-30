import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { LayoutGrid, Map as MapIcon } from 'lucide-react';
import { formatSeason, matches, type Budget, type DestinationCard, type Vibe } from '../../lib/destinations';
import Card from './Card';
import Filters from './Filters';

// Only fetch the map code when someone switches to the map.
const MapView = lazy(() => import('./MapView'));

type View = 'grid' | 'map';

type Props = {
  destinations: DestinationCard[];
  initialMonth: number | null;
  initialVibe: Vibe | null;
  initialBudget: Budget | null;
  initialView: View;
  initialQuery: string;
};

/** Full destinations grid or map. Filters and view are mirrored into the URL so they can be shared. */
export default function Browser({ destinations, initialMonth, initialVibe, initialBudget, initialView, initialQuery }: Props) {
  const [query, setQuery] = useState(initialQuery);
  const [month, setMonth] = useState(initialMonth);
  const [vibe, setVibe] = useState(initialVibe);
  const [budget, setBudget] = useState(initialBudget);
  const [view, setView] = useState<View>(initialView);

  useEffect(() => {
    const params = new URLSearchParams();
    if (query.trim()) params.set('q', query.trim());
    if (month) params.set('month', String(month));
    if (vibe) params.set('vibe', vibe);
    if (budget) params.set('budget', budget);
    if (view === 'map') params.set('view', 'map');
    const search = params.toString();
    history.replaceState(null, '', search ? `?${search}` : location.pathname);
  }, [query, month, vibe, budget, view]);

  const results = destinations.filter((d) => matches(d, month, vibe, query, budget));
  const points = useMemo(
    () =>
      results.map((d) => ({
        id: d.id,
        name: d.name,
        lat: d.coordinates.lat,
        lng: d.coordinates.lng,
        note: `${d.state} · best ${formatSeason(d.bestMonths)}`,
      })),
    // Recompute only when the set of results changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [results.map((d) => d.id).join()],
  );

  return (
    <div>
      <Filters
        query={query}
        month={month}
        vibe={vibe}
        budget={budget}
        onQuery={setQuery}
        onMonth={setMonth}
        onVibe={setVibe}
        onBudget={setBudget}
      />

      <div className="mt-6 flex items-center justify-between gap-4">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <p aria-live="polite" className="font-display text-xl">
            {results.length} of {destinations.length} places
          </p>
          {(month || vibe || budget || query) && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setMonth(null);
                setVibe(null);
                setBudget(null);
              }}
              className="text-sm font-semibold text-accent underline decoration-accent/40 underline-offset-4 hover:text-moss"
            >
              Clear filters
            </button>
          )}
        </div>
        <div className="flex shrink-0 rounded-full bg-paper-deep p-1 shadow-inner" role="group" aria-label="View">
          {(
            [
              ['grid', 'Cards', LayoutGrid],
              ['map', 'Map', MapIcon],
            ] as const
          ).map(([value, label, Icon]) => (
            <button
              key={value}
              type="button"
              aria-pressed={view === value}
              onClick={() => setView(value)}
              className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold text-ink-soft transition-colors hover:text-ink aria-pressed:bg-card aria-pressed:text-accent aria-pressed:shadow-sm"
            >
              <Icon className="size-4" aria-hidden="true" /> {label}
            </button>
          ))}
        </div>
      </div>

      {results.length === 0 ? (
        <p className="py-16 text-center text-ink-soft">Nothing matches yet. Try a different month or mood.</p>
      ) : view === 'map' ? (
        <div className="mt-8 grid gap-6 lg:grid-cols-12">
          <div className="h-[60vh] min-h-96 overflow-hidden rounded-[1.75rem] lg:col-span-8">
            <Suspense fallback={<div className="size-full animate-pulse bg-sage-soft" />}>
              <MapView points={points} ariaLabel="Map of matching destinations" />
            </Suspense>
          </div>
          <ul className="space-y-3 lg:col-span-4 lg:max-h-[60vh] lg:overflow-y-auto">
            {results.map((d) => (
              <li key={d.id}>
                <a href={`/destinations/${d.id}`} className="flex items-center gap-3 rounded-2xl bg-card p-3 shadow-sm ring-1 ring-line/60 hover:text-accent">
                  <img src={d.image.src} alt="" className="size-14 rounded-xl object-cover" />
                  <span>
                    <span className="block font-medium">{d.name}</span>
                    <span className="block text-xs text-ink-soft">
                      {d.state} · {formatSeason(d.bestMonths)}
                    </span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {results.map((d, i) => (
            <Card key={d.id} d={d} eager={i < 3} />
          ))}
        </div>
      )}
    </div>
  );
}
