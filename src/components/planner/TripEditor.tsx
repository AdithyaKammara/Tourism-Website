import { useId, useState } from 'react';
import { ArrowLeft, CalendarPlus, Minus, Plus, Printer } from 'lucide-react';
import { downloadFile, fileSafe, tripToICS } from '../../lib/planner/export';
import { usePlanner } from '../../lib/planner/store';
import type { SyncStatus } from '../../lib/planner/sync';
import { tripDateRange, type Trip } from '../../lib/planner/types';
import Bookings from './Bookings';
import Budget from './Budget';
import Itinerary from './Itinerary';
import Packing from './Packing';
import PrintView from './PrintView';
import TripMap from './TripMap';
import { inputClass, SyncBadge, useDestinations } from './ui';

const TABS = ['Itinerary', 'Map', 'Budget', 'Packing', 'Bookings'] as const;
type Tab = (typeof TABS)[number];

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
    <div className="print:hidden">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button type="button" onClick={onBack} className="eyebrow inline-flex items-center gap-2 hover:text-accent">
          <ArrowLeft className="size-3.5" aria-hidden="true" /> All trips
        </button>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="btn-outline py-2"
            disabled={!trip.startDate}
            title={trip.startDate ? undefined : 'Add a start date first'}
            onClick={() => downloadFile(`${fileSafe(trip.title)}.ics`, tripToICS(trip, destinations), 'text/calendar')}
          >
            <CalendarPlus className="size-4" aria-hidden="true" /> Add to calendar
          </button>
          <button type="button" className="btn-outline py-2" onClick={() => window.print()}>
            <Printer className="size-4" aria-hidden="true" /> Print or save PDF
          </button>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
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
            className="w-full rounded-xl bg-transparent font-display text-4xl leading-tight hover:bg-paper-deep/60 focus:bg-paper-deep/60 focus:outline-none md:text-6xl"
          />
          <p className="mt-2 text-sm text-ink-soft">
            {trip.days.length} {trip.days.length === 1 ? 'day' : 'days'}
            {range && ` · ${range}`}
          </p>
        </div>
        <SyncBadge status={status} />
      </div>

      <div className="mt-8 grid gap-4 rounded-3xl bg-card p-5 shadow-soft sm:grid-cols-2 lg:grid-cols-[auto_auto_1fr] lg:items-end lg:gap-8">
        <div>
          <label htmlFor={`${baseId}-start`} className="mb-1.5 block text-xs font-medium text-ink-soft">
            Start date
          </label>
          <input
            id={`${baseId}-start`}
            type="date"
            value={trip.startDate ?? ''}
            onChange={(e) => update(trip.id, (t) => void (t.startDate = e.target.value || undefined))}
            className={inputClass}
          />
        </div>
        <div>
          <p className="mb-1.5 text-xs font-medium text-ink-soft" id={`${baseId}-travellers`}>
            Travellers
          </p>
          <div className="flex items-center gap-1" role="group" aria-labelledby={`${baseId}-travellers`}>
            <button
              type="button"
              aria-label="One fewer traveller"
              disabled={trip.travellers <= 1}
              onClick={() => update(trip.id, (t) => void (t.travellers = Math.max(1, t.travellers - 1)))}
              className="grid size-10 place-items-center rounded-full border border-line hover:border-ink disabled:opacity-40"
            >
              <Minus className="size-4" aria-hidden="true" />
            </button>
            <span className="w-10 text-center text-lg tabular-nums" aria-live="polite">
              {trip.travellers}
            </span>
            <button
              type="button"
              aria-label="One more traveller"
              disabled={trip.travellers >= 50}
              onClick={() => update(trip.id, (t) => void (t.travellers = Math.min(50, t.travellers + 1)))}
              className="grid size-10 place-items-center rounded-full border border-line hover:border-ink disabled:opacity-40"
            >
              <Plus className="size-4" aria-hidden="true" />
            </button>
          </div>
        </div>
        <div className="sm:col-span-2 lg:col-span-1">
          <p className="mb-1.5 text-xs font-medium text-ink-soft">Places</p>
          <div className="flex flex-wrap items-center gap-2">
            {trip.destinationIds.map((id) => {
              const d = destinations.get(id);
              return d ? (
                <a key={id} href={`/destinations/${id}`} className="inline-flex items-center gap-2 rounded-full bg-sage-soft py-1 pr-3 pl-1 text-sm hover:text-accent">
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
                className="rounded-full border border-dashed border-line bg-transparent px-3 py-1.5 text-sm hover:border-ink"
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
        </div>
      </div>

      <div role="tablist" aria-label="Trip sections" className="mt-10 flex gap-1 overflow-x-auto border-b border-line">
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
            className="-mb-px border-b-2 border-transparent px-4 py-3 text-sm whitespace-nowrap text-ink-soft transition-colors hover:text-ink aria-selected:border-accent aria-selected:text-ink"
          >
            {t}
          </button>
        ))}
      </div>
      <div id={`${baseId}-panel`} role="tabpanel" aria-labelledby={`${baseId}-tab-${tab}`} className="pt-8">
        {panels[tab]}
      </div>
    </div>
    </>
  );
}
