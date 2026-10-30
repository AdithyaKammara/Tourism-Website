import { CalendarPlus, Lightbulb, Printer, WifiOff } from 'lucide-react';
import { downloadFile, fileSafe, tripToICS } from '../../lib/planner/export';
import { usePlanner } from '../../lib/planner/store';
import { EXPENSE_CATEGORIES, formatINR, tripSpend, type Trip } from '../../lib/planner/types';
import { LABELS } from './Budget';
import { useDestinations } from './ui';

const card = 'rounded-[1.75rem] bg-card p-6 shadow-sm ring-1 ring-line/60';

/** Budget and packing at a glance, plus the offline exports. Shown beside every planner tab on wide screens. */
export default function Sidebar({ trip, onTab }: { trip: Trip; onTab: (tab: 'Budget' | 'Packing') => void }) {
  const update = usePlanner((s) => s.updateTrip);
  const destinations = useDestinations();
  const { byCategory, total } = tripSpend(trip);
  const usedPct = trip.budget ? Math.min(100, Math.round((total / trip.budget) * 100)) : 0;
  const largest = Math.max(1, ...Object.values(byCategory));
  const packed = trip.packing.filter((p) => p.packed).length;
  const toPack = trip.packing.filter((p) => !p.packed).slice(0, 5);
  const tip = trip.destinationIds.map((id) => destinations.get(id)).find(Boolean);

  return (
    <div className="space-y-5">
      <section className={card} aria-labelledby="sb-budget">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="sb-budget" className="font-display text-xl">
              Budget summary
            </h2>
            <p className="text-sm text-ink-soft">Expenses plus itinerary costs</p>
          </div>
          {trip.budget ? (
            <span className="shrink-0 rounded-full bg-sage-light px-3 py-1 text-xs font-bold text-forest">{usedPct}% used</span>
          ) : null}
        </div>

        <div className="mt-4 rounded-2xl bg-paper-deep p-4">
          <div className="flex items-baseline justify-between gap-2">
            <p>
              <span className="font-display text-3xl font-heavy text-accent">{formatINR(total)}</span>
              <span className="text-sm text-ink-soft"> planned</span>
            </p>
            {trip.budget ? <span className="text-xs font-semibold">Cap: {formatINR(trip.budget)}</span> : null}
          </div>
          {trip.budget ? (
            <>
              <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-line" aria-hidden="true">
                <div className="h-full rounded-full bg-accent" style={{ width: `${usedPct}%` }} />
              </div>
              <p className="mt-2 flex justify-between text-xs text-ink-soft">
                <span>{trip.budget - total >= 0 ? 'Left to spend' : 'Over budget by'}</span>
                <span className="font-bold text-ink">{formatINR(Math.abs(trip.budget - total))}</span>
              </p>
            </>
          ) : (
            <button type="button" onClick={() => onTab('Budget')} className="mt-2 text-xs font-semibold text-accent hover:underline">
              Set a budget cap
            </button>
          )}
        </div>

        <ul className="mt-4 space-y-2.5">
          {EXPENSE_CATEGORIES.filter((c) => byCategory[c] > 0).map((c) => (
            <li key={c}>
              <div className="flex justify-between text-xs font-semibold">
                <span>{LABELS[c]}</span>
                <span>{formatINR(byCategory[c])}</span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-paper-deep" aria-hidden="true">
                <div className="h-full rounded-full bg-accent/80" style={{ width: `${(byCategory[c] / largest) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>

        {tip && (
          <p className="mt-4 flex items-start gap-3 rounded-2xl bg-sage-soft p-4 text-sm text-moss">
            <Lightbulb className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
            <span>
              <strong className="block font-semibold">Our estimate for {tip.name}</strong>
              About {formatINR(tip.budgetPerDay.low)}–{formatINR(tip.budgetPerDay.high).replace('₹', '')} per person per day.
            </span>
          </p>
        )}
      </section>

      <section className={card} aria-labelledby="sb-packing">
        <div className="flex items-start justify-between gap-3">
          <h2 id="sb-packing" className="font-display text-xl">
            Packing checklist
          </h2>
          <span className="shrink-0 rounded-full bg-paper-deep px-3 py-1 text-xs font-bold text-accent">
            {packed} of {trip.packing.length} packed
          </span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-paper-deep" aria-hidden="true">
          <div className="h-full rounded-full bg-accent" style={{ width: `${trip.packing.length ? (packed / trip.packing.length) * 100 : 0}%` }} />
        </div>
        {toPack.length > 0 && (
          <ul className="mt-3 space-y-1 text-sm">
            {toPack.map((item) => (
              <li key={item.id}>
                <label className="flex cursor-pointer items-center gap-3 rounded-xl p-2 hover:bg-paper-deep">
                  <input
                    type="checkbox"
                    checked={item.packed}
                    onChange={() =>
                      update(trip.id, (t) => {
                        const it = t.packing.find((p) => p.id === item.id);
                        if (it) it.packed = !it.packed;
                      })
                    }
                    className="size-4 accent-[var(--accent)]"
                  />
                  {item.label}
                </label>
              </li>
            ))}
          </ul>
        )}
        <button type="button" onClick={() => onTab('Packing')} className="mt-2 text-sm font-semibold text-accent hover:underline">
          {trip.packing.length ? 'Open the full list' : 'Start a packing list'}
        </button>
      </section>

      <section className="relative overflow-clip rounded-[1.75rem] bg-forest p-6 text-cream shadow-sm">
        <span className="grid size-10 place-items-center rounded-full bg-cream/10 text-sage-light">
          <WifiOff className="size-5" aria-hidden="true" />
        </span>
        <h2 className="mt-4 font-display text-xl">Take it offline</h2>
        <p className="mt-1 text-sm text-cream/70">Print the plan or save it as a PDF, or add each day to your calendar before you lose signal.</p>
        <div className="mt-5 grid gap-2">
          <button type="button" onClick={() => window.print()} className="btn w-full bg-sage-light font-semibold text-forest hover:bg-cream">
            <Printer className="size-4" aria-hidden="true" /> Print or save PDF
          </button>
          <button
            type="button"
            disabled={!trip.startDate}
            title={trip.startDate ? undefined : 'Add a start date first'}
            onClick={() => downloadFile(`${fileSafe(trip.title)}.ics`, tripToICS(trip, destinations), 'text/calendar')}
            className="btn w-full bg-cream/10 font-semibold text-cream hover:bg-cream/20 disabled:opacity-50"
          >
            <CalendarPlus className="size-4" aria-hidden="true" /> Add to calendar
          </button>
        </div>
      </section>
    </div>
  );
}
