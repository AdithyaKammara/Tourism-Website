import { useId, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { usePlanner } from '../../lib/planner/store';
import { EXPENSE_CATEGORIES, formatINR, tripSpend, uid, type ExpenseCategory, type Trip } from '../../lib/planner/types';
import { EmptyNote, inputClass, useDestinations } from './ui';

export const LABELS: Record<ExpenseCategory, string> = {
  stay: 'Stay',
  transport: 'Transport',
  food: 'Food',
  activities: 'Activities',
  other: 'Other',
};

export default function Budget({ trip }: { trip: Trip }) {
  const update = usePlanner((s) => s.updateTrip);
  const destinations = useDestinations();
  const id = useId();

  const { byCategory, total } = tripSpend(trip);
  const itineraryCost = trip.days.flatMap((d) => d.items).reduce((sum, i) => sum + (i.cost ?? 0), 0);
  const largest = Math.max(1, ...Object.values(byCategory));

  // Our estimate: each day's base destination's daily range, per traveller.
  const estimate = trip.days.reduce(
    (acc, day) => {
      const d = day.destinationId ? destinations.get(day.destinationId) : undefined;
      if (!d) return acc;
      return { low: acc.low + d.budgetPerDay.low * trip.travellers, high: acc.high + d.budgetPerDay.high * trip.travellers, days: acc.days + 1 };
    },
    { low: 0, high: 0, days: 0 },
  );

  const remaining = trip.budget !== undefined ? trip.budget - total : null;
  const usedPct = trip.budget ? Math.min(100, Math.round((total / trip.budget) * 100)) : 0;

  return (
    <div className="grid gap-8 lg:grid-cols-12">
      <div className="space-y-6 lg:col-span-5">
        <div className="rounded-3xl bg-card p-6 shadow-soft">
          <label htmlFor={`${id}-budget`} className="mb-1.5 block text-xs font-medium text-ink-soft">
            Total budget for the group
          </label>
          <div className="flex items-center gap-2">
            <span className="text-xl text-ink-soft" aria-hidden="true">₹</span>
            <input
              id={`${id}-budget`}
              type="number"
              min={0}
              inputMode="numeric"
              placeholder="e.g. 40000"
              value={trip.budget ?? ''}
              onChange={(e) => update(trip.id, (t) => void (t.budget = e.target.value ? Math.max(0, Number(e.target.value)) : undefined))}
              className="w-full bg-transparent font-display text-4xl focus:outline-none"
            />
          </div>
          {estimate.days > 0 && (
            <p className="mt-3 text-sm text-ink-soft">
              Our rough estimate for {estimate.days} {estimate.days === 1 ? 'day' : 'days'} and {trip.travellers}{' '}
              {trip.travellers === 1 ? 'person' : 'people'}: {formatINR(estimate.low)} – {formatINR(estimate.high)}, not counting travel to get there.
            </p>
          )}
        </div>

        <dl className="grid grid-cols-2 gap-4">
          <Stat label="Spent / planned" value={formatINR(total)} />
          <Stat label="Per person" value={formatINR(Math.round(total / trip.travellers))} />
          {remaining !== null && (
            <div className="col-span-2 rounded-3xl bg-card p-5 shadow-soft">
              <dt className="text-xs text-ink-soft">{remaining >= 0 ? 'Left to spend' : 'Over budget by'}</dt>
              <dd className={`mt-1 font-display text-3xl ${remaining < 0 ? 'text-red-700 dark:text-red-400' : ''}`}>{formatINR(Math.abs(remaining))}</dd>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-paper-deep" role="progressbar" aria-valuenow={usedPct} aria-valuemin={0} aria-valuemax={100} aria-label="Budget used">
                <div className={`h-full rounded-full ${remaining < 0 ? 'bg-red-600' : 'bg-accent'}`} style={{ width: `${usedPct}%` }} />
              </div>
            </div>
          )}
        </dl>

        <div className="rounded-3xl bg-card p-6 shadow-soft">
          <h3 className="text-sm font-medium">By category</h3>
          <ul className="mt-4 space-y-3">
            {EXPENSE_CATEGORIES.map((c) => (
              <li key={c} className="grid grid-cols-[6rem_1fr_auto] items-center gap-3 text-sm">
                <span className="text-ink-soft">{LABELS[c]}</span>
                <span className="h-2 overflow-hidden rounded-full bg-paper-deep" aria-hidden="true">
                  <span className="block h-full rounded-full bg-moss" style={{ width: `${(byCategory[c] / largest) * 100}%` }} />
                </span>
                <span className="tabular-nums">{formatINR(byCategory[c])}</span>
              </li>
            ))}
          </ul>
          {itineraryCost > 0 && <p className="mt-4 text-xs text-ink-soft">Activities include {formatINR(itineraryCost)} from costs in your itinerary.</p>}
        </div>
      </div>

      <div className="lg:col-span-7">
        <h3 className="font-display text-2xl">Expenses</h3>
        <AddExpense onAdd={(e) => update(trip.id, (t) => void t.expenses.push(e))} />
        <div className="mt-6">
          {trip.expenses.length === 0 ? (
            <EmptyNote>Add hotels, tickets, meals or anything else you’ve paid for or expect to.</EmptyNote>
          ) : (
            <ul className="divide-y divide-line rounded-3xl bg-card px-5 shadow-soft">
              {trip.expenses.map((e) => (
                <li key={e.id} className="flex items-center gap-3 py-3 text-sm">
                  <span className="w-24 shrink-0 text-xs text-ink-soft">{LABELS[e.category]}</span>
                  <span className="min-w-0 flex-1 truncate">{e.label}</span>
                  <span className="tabular-nums">{formatINR(e.amount)}</span>
                  <button
                    type="button"
                    aria-label={`Remove ${e.label}`}
                    onClick={() => update(trip.id, (t) => void (t.expenses = t.expenses.filter((x) => x.id !== e.id)))}
                    className="grid size-8 place-items-center rounded-lg text-ink-soft hover:bg-paper-deep hover:text-red-700"
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl bg-card p-5 shadow-soft">
      <dt className="text-xs text-ink-soft">{label}</dt>
      <dd className="mt-1 font-display text-2xl">{value}</dd>
    </div>
  );
}

function AddExpense({ onAdd }: { onAdd: (e: { id: string; label: string; category: ExpenseCategory; amount: number }) => void }) {
  const [label, setLabel] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('stay');
  const [amount, setAmount] = useState('');
  const valid = label.trim() && Number(amount) > 0;

  return (
    <form
      className="mt-4 flex flex-wrap gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (!valid) return;
        onAdd({ id: uid(), label: label.trim(), category, amount: Number(amount) });
        setLabel('');
        setAmount('');
      }}
    >
      <select aria-label="Category" value={category} onChange={(e) => setCategory(e.target.value as ExpenseCategory)} className={`${inputClass} w-36`}>
        {EXPENSE_CATEGORIES.map((c) => (
          <option key={c} value={c}>
            {LABELS[c]}
          </option>
        ))}
      </select>
      <input aria-label="What it's for" placeholder="Homestay in Munnar, 2 nights" maxLength={120} value={label} onChange={(e) => setLabel(e.target.value)} className={`${inputClass} min-w-40 flex-1`} />
      <input aria-label="Amount in rupees" type="number" min={1} inputMode="numeric" placeholder="₹ amount" value={amount} onChange={(e) => setAmount(e.target.value)} className={`${inputClass} w-32`} />
      <button type="submit" className="btn-outline py-2.5" disabled={!valid}>
        <Plus className="size-4" aria-hidden="true" /> Add
      </button>
    </form>
  );
}
