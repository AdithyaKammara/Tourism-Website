import { useId } from 'react';
import { MONTHS, VIBE_LABELS, type Vibe } from '../../lib/destinations';

type Props = {
  month: number | null;
  vibe: Vibe | null;
  onMonth: (m: number | null) => void;
  onVibe: (v: Vibe | null) => void;
};

export default function Filters({ month, vibe, onMonth, onVibe }: Props) {
  const monthId = useId();

  return (
    <div className="flex flex-col gap-6 md:flex-row md:items-end">
      <div className="shrink-0">
        <label htmlFor={monthId} className="eyebrow block">
          When
        </label>
        <select
          id={monthId}
          value={month ?? ''}
          onChange={(e) => onMonth(e.target.value ? Number(e.target.value) : null)}
          className="mt-1 w-full min-w-40 border-0 border-b border-line bg-transparent py-2 pr-8 font-display text-2xl focus:border-ink focus:outline-none"
        >
          <option value="">Any month</option>
          {MONTHS.map((m, i) => (
            <option key={m} value={i + 1}>
              {new Date(2000, i).toLocaleString('en-GB', { month: 'long' })}
            </option>
          ))}
        </select>
      </div>

      <fieldset className="min-w-0">
        <legend className="eyebrow mb-2">In the mood for</legend>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(VIBE_LABELS) as Vibe[]).map((v) => {
            const active = vibe === v;
            return (
              <button
                key={v}
                type="button"
                aria-pressed={active}
                onClick={() => onVibe(active ? null : v)}
                className="rounded-full border border-line px-4 py-2 text-sm transition-colors hover:border-ink aria-pressed:border-ink aria-pressed:bg-ink aria-pressed:text-paper"
              >
                {VIBE_LABELS[v]}
              </button>
            );
          })}
        </div>
      </fieldset>
    </div>
  );
}
