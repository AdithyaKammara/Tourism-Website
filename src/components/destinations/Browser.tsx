import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { LayoutGrid, Map as MapIcon, Search } from 'lucide-react';
import { formatSeason, matches, type DestinationCard, type Vibe } from '../../lib/destinations';
import Card from './Card';
import Filters from './Filters';

// Only fetch the map code when someone switches to the map.
const MapView = lazy(() => import('./MapView'));

type View = 'grid' | 'map';

type Props = {
  destinations: DestinationCard[];
  initialMonth: number | null;
  initialVibe: Vibe | null;
  initialView: View;
  initialQuery: string;
};

/** Full destinations grid or map. Filters and view are mirrored into the URL so they can be shared. */
export default function Browser({ destinations, initialMonth, initialVibe, initialView, initialQuery }: Props) {
  const [query, setQuery] = useState(initialQuery);
  const [month, setMonth] = useState(initialMonth);
  const [vibe, setVibe] = useState(initialVibe);
  const [view, setView] = useState<View>(initialView);

  useEffect(() => {
    const params = new URLSearchParams();
    if (query.trim()) params.set('q', query.trim());
    if (month) params.set('month', String(month));
    if (vibe) params.set('vibe', vibe);
    if (view === 'map') params.set('view', 'map');
    const search = params.toString();
    history.replaceState(null, '', search ? `?${search}` : location.pathname);
  }, [query, month, vibe, view]);

  const results = destinations.filter((d) => matches(d, month, vibe, query));
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
      <div className="mb-8 flex max-w-xl items-center gap-3 rounded-full border border-line bg-card px-5 py-1 focus-within:border-ink">
        <Search className="size-5 shrink-0 text-ink-soft" aria-hidden="true" />
        <label htmlFor="destination-search" className="sr-only">
          Search destinations
        </label>
        <input
          id="destination-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by place, state or mood"
          className="min-w-0 flex-1 bg-transparent py-2.5 focus:outline-none"
        />
      </div>
      <Filters month={month} vibe={vibe} onMonth={setMonth} onVibe={setVibe} />

      <div className="mt-10 flex items-center justify-between gap-4 border-b border-ink pb-3">
        <div className="flex items-baseline gap-4">
          <p aria-live="polite">
            {results.length} of {destinations.length} places
          </p>
          {(month || vibe || query) && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setMonth(null);
                setVibe(null);
              }}
              className="text-sm underline underline-offset-4 hover:text-accent"
            >
              Clear filters
            </button>
          )}
        </div>
        <div className="flex rounded-full border border-line p-1" role="group" aria-label="View">
          {(
            [
              ['grid', 'Grid', LayoutGrid],
              ['map', 'Map', MapIcon],
            ] as const
          ).map(([value, label, Icon]) => (
            <button
              key={value}
              type="button"
              aria-pressed={view === value}
              onClick={() => setView(value)}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm text-ink-soft transition-colors aria-pressed:bg-forest aria-pressed:text-cream dark:aria-pressed:bg-cream dark:aria-pressed:text-forest"
            >
              <Icon className="size-4" aria-hidden="true" /> {label}
            </button>
          ))}
        </div>
      </div>

      {results.length === 0 ? (
        <p className="py-16 text-center text-ink-soft">Nothing matches yet. Try a different month or mood.</p>
      ) : view === 'map' ? (
        <div className="mt-10 grid gap-6 lg:grid-cols-12">
          <div className="h-[60vh] min-h-96 overflow-hidden rounded-panel lg:col-span-8">
            <Suspense fallback={<div className="size-full animate-pulse bg-sage-soft" />}>
              <MapView points={points} ariaLabel="Map of matching destinations" />
            </Suspense>
          </div>
          <ul className="space-y-3 lg:col-span-4 lg:max-h-[60vh] lg:overflow-y-auto">
            {results.map((d) => (
              <li key={d.id}>
                <a href={`/destinations/${d.id}`} className="flex items-center gap-3 rounded-2xl bg-card p-3 shadow-soft hover:text-accent">
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
        <div className="mt-10 grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((d, i) => (
            <Card key={d.id} d={d} eager={i < 3} />
          ))}
        </div>
      )}
    </div>
  );
}
