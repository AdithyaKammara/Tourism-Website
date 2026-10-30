import { useId, useState } from 'react';
import { ArrowLeft, Backpack, CalendarDays, CalendarPlus, ListChecks, Map as MapIcon, Minus, Plus, Printer, Ticket, Users, Wallet, type LucideIcon } from 'lucide-react';
import { downloadFile, fileSafe, tripToICS } from '../../lib/planner/export';
import { usePlanner } from '../../lib/planner/store';
import type { SyncStatus } from '../../lib/planner/sync';
import { tripDateRange, type Trip } from '../../lib/planner/types';
import Bookings from './Bookings';
import Budget from './Budget';
import Itinerary from './Itinerary';
import Packing from './Packing';
import PrintView from './PrintView';
import Sidebar from './Sidebar';
import TripMap from './TripMap';
import { SyncBadge, useDestinations } from './ui';

const TABS = ['Itinerary', 'Map', 'Budget', 'Packing', 'Bookings'] as const;
type Tab = (typeof TABS)[number];
const TAB_ICONS: Record<Tab, LucideIcon> = { Itinerary: ListChecks, Map: MapIcon, Budget: Wallet, Packing: Backpack, Bookings: Ticket };

const pill = 'inline-flex items-center gap-2 rounded-full bg-paper-deep px-4 py-2 text-sm font-semibold';

export default function TripEditor({ trip, status, onBack }: { trip: Trip; status: SyncStatus; onBack: () => void }) {
  const update = usePlanner((s) => s.updateTrip);
  const addStop = usePlanner((s) => s.addStop);
  const destinations = useDestinations();
  const [tab, setTab] = useState<Tab>('Itinerary');
  const baseId = useId();
  const range = tripDateRange(trip);
  const notInTrip = [...destinations.values()].filter((d) => !trip.destinationIds.includes(d.id));

  const panels: Record<Tab, React.ReactNode> = {
    Itinerary: <Itinerary trip={trip} />,
    Map: <TripMap trip={trip} />,
    Budget: <Budget trip={trip} />,
    Packing: <Packing trip={trip} />,
    Bookings: <Bookings trip={trip} />,
  };

  return (
    <>
    <PrintView trip={trip} />
    <div className="space-y-6 print:hidden">
      <div className="flex min-w-0 flex-wrap items-center gap-3 text-sm">
        <button type="button" onClick={onBack} className="inline-flex items-center gap-1.5 font-semibold text-ink-soft hover:text-accent">
          <ArrowLeft className="size-4" aria-hidden="true" /> All trips
        </button>
        <span className="text-ink-soft">/</span>
        <span className="max-w-[50vw] truncate font-semibold">{trip.title}</span>
        <span className="rounded-full bg-sage-soft px-3 py-1">
          <SyncBadge status={status} />
        </span>
      </div>

      <div className="space-y-5 rounded-[28px] bg-card p-6 shadow-sm ring-1 ring-line/60 md:p-10">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <label htmlFor={`${baseId}-title`} className="sr-only">
              Trip name
            </label>
            <input
              id={`${baseId}-title`}
              value={trip.title}
              maxLength={120}
              onChange={(e) => update(trip.id, (t) => void (t.title = e.target.value))}
              onBlur={(e) => !e.target.value.trim() && update(trip.id, (t) => void (t.title = 'Untitled trip'))}
              className="font-heavy -mx-2 w-full rounded-xl bg-transparent px-2 font-display text-3xl leading-tight tracking-tight hover:bg-paper-deep/60 focus:bg-paper-deep/60 focus:outline-none md:text-5xl"
            />
            <p className="mt-1 text-ink-soft">
              {trip.days.length} {trip.days.length === 1 ? 'day' : 'days'}
              {range && ` · ${range}`}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <button
              type="button"
              className={`${pill} hover:bg-sage-soft disabled:opacity-50`}
              disabled={!trip.startDate}
              title={trip.startDate ? undefined : 'Add a start date first'}
              onClick={() => downloadFile(`${fileSafe(trip.title)}.ics`, tripToICS(trip, destinations), 'text/calendar')}
            >
              <CalendarPlus className="size-4" aria-hidden="true" /> Add to calendar
            </button>
            <button type="button" className={`${pill} hover:bg-sage-soft`} onClick={() => window.print()}>
              <Printer className="size-4" aria-hidden="true" /> Print or PDF
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className={`${pill} cursor-pointer`}>
            <CalendarDays className="size-4 text-accent" aria-hidden="true" />
            <span className="sr-only">Start date</span>
            <input
              type="date"
              value={trip.startDate ?? ''}
              onChange={(e) => update(trip.id, (t) => void (t.startDate = e.target.value || undefined))}
              className="bg-transparent focus:outline-none"
            />
          </label>
          <div className={pill} role="group" aria-label="Travellers">
            <Users className="size-4 text-accent" aria-hidden="true" />
            <button
              type="button"
              aria-label="One fewer traveller"
              disabled={trip.travellers <= 1}
              onClick={() => update(trip.id, (t) => void (t.travellers = Math.max(1, t.travellers - 1)))}
              className="grid size-6 place-items-center rounded-full hover:bg-card disabled:opacity-40"
            >
              <Minus className="size-3.5" aria-hidden="true" />
            </button>
            <span className="tabular-nums" aria-live="polite">
              {trip.travellers} {trip.travellers === 1 ? 'traveller' : 'travellers'}
            </span>
            <button
              type="button"
              aria-label="One more traveller"
              disabled={trip.travellers >= 50}
              onClick={() => update(trip.id, (t) => void (t.travellers = Math.min(50, t.travellers + 1)))}
              className="grid size-6 place-items-center rounded-full hover:bg-card disabled:opacity-40"
            >
              <Plus className="size-3.5" aria-hidden="true" />
            </button>
          </div>
          {trip.destinationIds.map((id) => {
            const d = destinations.get(id);
            return d ? (
              <a key={id} href={`/destinations/${id}`} className="inline-flex items-center gap-2 rounded-full bg-sage-soft py-1 pr-4 pl-1 text-sm font-semibold hover:text-accent">
                <img src={d.image.src} alt="" className="size-7 rounded-full object-cover" />
                {d.name}
              </a>
            ) : null;
          })}
          {notInTrip.length > 0 && (
            <select
              aria-label="Add a place"
              value=""
              onChange={(e) => {
                const d = destinations.get(e.target.value);
                if (d) addStop(trip.id, d.id, d.daysNeeded.min);
              }}
              className="cursor-pointer rounded-full bg-paper-deep px-4 py-2 text-sm font-semibold text-accent hover:bg-sage-soft focus:outline-none"
            >
              <option value="">+ Add a place</option>
              {notInTrip.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.daysNeeded.min}+ days)
                </option>
              ))}
            </select>
          )}
        </div>

      <div role="tablist" aria-label="Trip sections" className="-mx-1 flex gap-1.5 overflow-x-auto px-1 py-1">
        {TABS.map((t) => (
          <button
            key={t}
            id={`${baseId}-tab-${t}`}
            role="tab"
            type="button"
            aria-selected={tab === t}
            aria-controls={`${baseId}-panel`}
            tabIndex={tab === t ? 0 : -1}
            onClick={() => setTab(t)}
            onKeyDown={(e) => {
              const i = TABS.indexOf(t);
              const next = e.key === 'ArrowRight' ? TABS[(i + 1) % TABS.length] : e.key === 'ArrowLeft' ? TABS[(i - 1 + TABS.length) % TABS.length] : null;
              if (next) {
                setTab(next);
                document.getElementById(`${baseId}-tab-${next}`)?.focus();
              }
            }}
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-paper-deep px-5 py-2.5 text-sm font-semibold whitespace-nowrap text-ink-soft transition-colors hover:text-ink aria-selected:bg-accent aria-selected:text-accent-ink"
          >
            <TabIcon tab={t} />
            {t}
          </button>
        ))}
      </div>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-12">
        <div
          id={`${baseId}-panel`}
          role="tabpanel"
          aria-labelledby={`${baseId}-tab-${tab}`}
          className="min-w-0 rounded-[28px] bg-card p-5 shadow-sm ring-1 ring-line/60 md:p-8 lg:col-span-8"
        >
          {panels[tab]}
        </div>
        <aside className="lg:sticky lg:top-24 lg:col-span-4" aria-label="Trip summary">
          <Sidebar trip={trip} onTab={setTab} />
        </aside>
      </div>
    </div>
    </>
  );
}

function TabIcon({ tab }: { tab: Tab }) {
  const Icon = TAB_ICONS[tab];
  return <Icon className="size-4" aria-hidden="true" />;
}
