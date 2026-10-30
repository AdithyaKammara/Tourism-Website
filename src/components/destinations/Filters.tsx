import { useId } from 'react';
import { ChevronDown, Search, SunMedium, Wallet } from 'lucide-react';
import { BUDGETS, MONTHS, VIBE_LABELS, type Budget, type Vibe } from '../../lib/destinations';

type Props = {
  query: string;
  month: number | null;
  vibe: Vibe | null;
  budget: Budget | null;
  onQuery: (q: string) => void;
  onMonth: (m: number | null) => void;
  onVibe: (v: Vibe | null) => void;
  onBudget: (b: Budget | null) => void;
};

const field = 'flex items-center gap-2 rounded-full bg-paper-deep px-4 transition-colors focus-within:bg-sage-soft hover:bg-sage-soft';

/** The white filter bar: search, month and budget on one row, moods on a scrolling rail below. */
export default function Filters({ query, month, vibe, budget, onQuery, onMonth, onVibe, onBudget }: Props) {
  const id = useId();

  return (
    <div className="rounded-[2rem] bg-card p-2 shadow-[0_8px_32px_rgb(3_31_35/0.05)] ring-1 ring-line/60">
      <div className="grid gap-1.5 md:grid-cols-12">
        <div className={`${field} md:col-span-6`}>
          <Search className="size-5 shrink-0 text-ink-soft" aria-hidden="true" />
          <label htmlFor={`${id}-q`} className="sr-only">
            Search destinations
          </label>
          <input
            id={`${id}-q`}
            type="search"
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder="Search by place, state or mood"
            className="min-w-0 flex-1 bg-transparent py-2.5 focus:outline-none"
          />
        </div>

        <div className={`${field} relative md:col-span-3`}>
          <SunMedium className="size-4 shrink-0 text-accent" aria-hidden="true" />
          <label htmlFor={`${id}-month`} className="sr-only">
            When
          </label>
          <select
            id={`${id}-month`}
            value={month ?? ''}
            onChange={(e) => onMonth(e.target.value ? Number(e.target.value) : null)}
            className="min-w-0 flex-1 cursor-pointer appearance-none bg-transparent py-2.5 pr-6 text-sm font-semibold focus:outline-none"
          >
            <option value="">Any month</option>
            {MONTHS.map((m, i) => (
              <option key={m} value={i + 1}>
                {new Date(2000, i).toLocaleString('en-GB', { month: 'long' })}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-4 size-4 text-ink-soft" aria-hidden="true" />
        </div>

        <div className={`${field} relative md:col-span-3`}>
          <Wallet className="size-4 shrink-0 text-ink-soft" aria-hidden="true" />
          <label htmlFor={`${id}-budget`} className="sr-only">
            Daily budget
          </label>
          <select
            id={`${id}-budget`}
            value={budget ?? ''}
            onChange={(e) => onBudget((e.target.value || null) as Budget | null)}
            className="min-w-0 flex-1 cursor-pointer appearance-none bg-transparent py-2.5 pr-6 text-sm font-semibold focus:outline-none"
          >
            <option value="">Daily: any budget</option>
            {(Object.keys(BUDGETS) as Budget[]).map((b) => (
              <option key={b} value={b}>
                {BUDGETS[b].label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-4 size-4 text-ink-soft" aria-hidden="true" />
        </div>
      </div>

      <fieldset className="mt-2 flex items-center gap-2 overflow-x-auto px-1 pb-1">
        <legend className="sr-only">In the mood for</legend>
        <span aria-hidden="true" className="shrink-0 pr-1 text-xs font-semibold tracking-wider text-ink-soft uppercase">
          Mood
        </span>
        <button
          type="button"
          aria-pressed={vibe === null}
          onClick={() => onVibe(null)}
          className="h-8 shrink-0 rounded-full bg-paper-deep px-4 text-sm font-semibold text-ink-soft transition-colors hover:bg-sage-soft aria-pressed:bg-accent aria-pressed:text-accent-ink"
        >
          All places
        </button>
        {(Object.keys(VIBE_LABELS) as Vibe[]).map((v) => (
          <button
            key={v}
            type="button"
            aria-pressed={vibe === v}
            onClick={() => onVibe(vibe === v ? null : v)}
            className="h-8 shrink-0 rounded-full bg-paper-deep px-4 text-sm font-semibold text-ink-soft transition-colors hover:bg-sage-soft aria-pressed:bg-accent aria-pressed:text-accent-ink"
          >
            {VIBE_LABELS[v]}
          </button>
        ))}
      </fieldset>
    </div>
  );
}
