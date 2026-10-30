import { useState } from 'react';
import { Plus, Sparkles, X } from 'lucide-react';
import { starterPacking } from '../../lib/planner/packing';
import { usePlanner } from '../../lib/planner/store';
import { uid, type Trip } from '../../lib/planner/types';
import { inputClass, useDestinations } from './ui';

const GROUPS = ['Documents', 'Clothes', 'Toiletries', 'Tech', 'Other'];

export default function Packing({ trip }: { trip: Trip }) {
  const update = usePlanner((s) => s.updateTrip);
  const destinations = useDestinations();
  const [label, setLabel] = useState('');
  const [group, setGroup] = useState('Other');

  const packed = trip.packing.filter((p) => p.packed).length;
  const groups = [...new Set([...GROUPS, ...trip.packing.map((p) => p.group)])].filter((g) => trip.packing.some((p) => p.group === g));

  function addSuggestions() {
    const vibes = trip.destinationIds.flatMap((id) => destinations.get(id)?.vibes ?? []);
    update(trip.id, (t) => {
      const have = new Set(t.packing.map((p) => p.label.toLowerCase()));
      t.packing.push(...starterPacking(vibes).filter((p) => !have.has(p.label.toLowerCase())));
    });
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-display text-3xl">
            {packed} <span className="text-ink-soft">of {trip.packing.length} packed</span>
          </p>
          <div className="mt-3 h-2 w-64 max-w-full overflow-hidden rounded-full bg-paper-deep" aria-hidden="true">
            <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${trip.packing.length ? (packed / trip.packing.length) * 100 : 0}%` }} />
          </div>
        </div>
        <button type="button" className="btn-outline py-2" onClick={addSuggestions}>
          <Sparkles className="size-4" aria-hidden="true" /> Add suggestions for these places
        </button>
      </div>

      <form
        className="mt-6 flex flex-wrap gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!label.trim()) return;
          update(trip.id, (t) => void t.packing.push({ id: uid(), label: label.trim(), group, packed: false }));
          setLabel('');
        }}
      >
        <select aria-label="Group" value={group} onChange={(e) => setGroup(e.target.value)} className={`${inputClass} w-36`}>
          {GROUPS.map((g) => (
            <option key={g}>{g}</option>
          ))}
        </select>
        <input aria-label="Item to pack" placeholder="Add something to pack" maxLength={120} value={label} onChange={(e) => setLabel(e.target.value)} className={`${inputClass} min-w-48 flex-1`} />
        <button type="submit" className="btn-outline py-2.5" disabled={!label.trim()}>
          <Plus className="size-4" aria-hidden="true" /> Add
        </button>
      </form>

      <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {groups.map((g) => (
          <section key={g} className="rounded-3xl bg-card p-5 shadow-soft" aria-label={g}>
            <h3 className="eyebrow">{g}</h3>
            <ul className="mt-3 space-y-1">
              {trip.packing
                .filter((p) => p.group === g)
                .map((p) => (
                  <li key={p.id} className="group flex items-center gap-3 rounded-xl px-2 py-1.5 hover:bg-paper-deep/60">
                    <input
                      type="checkbox"
                      id={`pack-${p.id}`}
                      checked={p.packed}
                      onChange={(e) =>
                        update(trip.id, (t) => {
                          const item = t.packing.find((x) => x.id === p.id);
                          if (item) item.packed = e.target.checked;
                        })
                      }
                      className="size-4 accent-[var(--accent)]"
                    />
                    <label htmlFor={`pack-${p.id}`} className={`flex-1 text-sm ${p.packed ? 'text-ink-soft line-through' : ''}`}>
                      {p.label}
                    </label>
                    <button
                      type="button"
                      aria-label={`Remove ${p.label}`}
                      onClick={() => update(trip.id, (t) => void (t.packing = t.packing.filter((x) => x.id !== p.id)))}
                      className="grid size-7 place-items-center rounded-lg text-ink-soft opacity-0 group-hover:opacity-100 hover:text-red-700 focus-visible:opacity-100"
                    >
                      <X className="size-3.5" aria-hidden="true" />
                    </button>
                  </li>
                ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
