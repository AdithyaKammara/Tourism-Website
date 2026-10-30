import { useEffect, useMemo, useState } from 'react';
import type { DestinationCard } from '../../lib/destinations';
import { usePlanner } from '../../lib/planner/store';
import { useCloudSync } from '../../lib/planner/sync';
import Dashboard from './Dashboard';
import TripEditor from './TripEditor';
import { DestinationsContext } from './ui';

type Route = { tripId: string | null; add: string | null };

const readRoute = (): Route => {
  const params = new URLSearchParams(location.search);
  return { tripId: params.get('trip'), add: params.get('add') };
};

export default function PlannerApp({ userId, destinations }: { userId: string | null; destinations: DestinationCard[] }) {
  const status = useCloudSync(userId);
  const [route, setRoute] = useState<Route>(readRoute);
  const trip = usePlanner((s) => (route.tripId ? s.trips[route.tripId] : undefined));
  const lookup = useMemo(() => new Map(destinations.map((d) => [d.id, d])), [destinations]);

  useEffect(() => {
    const onPop = () => setRoute(readRoute());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  function go(tripId: string | null) {
    history.pushState(null, '', tripId ? `/planner?trip=${tripId}` : '/planner');
    setRoute({ tripId, add: null });
    window.scrollTo({ top: 0 });
  }

  return (
    <DestinationsContext.Provider value={lookup}>
      {trip ? (
        <TripEditor trip={trip} status={status} onBack={() => go(null)} />
      ) : (
        <Dashboard
          status={status}
          signedIn={Boolean(userId)}
          addId={route.add && lookup.has(route.add) ? route.add : null}
          missingTrip={Boolean(route.tripId) && status !== 'loading'}
          onOpen={go}
        />
      )}
    </DestinationsContext.Provider>
  );
}
