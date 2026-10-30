import { useId, useState, type ReactNode } from 'react';
import { ArrowRight, CalendarDays, ChevronDown, Compass } from 'lucide-react';
import { matches, MONTHS, VIBE_LABELS, type DestinationCard, type Vibe } from '../../lib/destinations';

/** The floating "when / mood" card on the home hero. */
export default function TripFinder({ destinations }: { destinations: DestinationCard[] }) {
  const [month, setMonth] = useState<number | null>(() => new Date().getMonth() + 1);
  const [vibe, setVibe] = useState<Vibe | null>(null);

  const count = destinations.filter((d) => matches(d, month, vibe)).length;
  const params = new URLSearchParams();
  if (month) params.set('month', String(month));
  if (vibe) params.set('vibe', vibe);

  return (
    <form
      action="/destinations"
      className="w-full rounded-3xl bg-card p-5 text-ink shadow-soft sm:w-80"
      onSubmit={(e) => {
        e.preventDefault();
        window.location.assign(`/destinations?${params}`);
      }}
    >
      <Row icon={<CalendarDays className="size-5" strokeWidth={1.5} />} label="When">
        {(id) => (
          <select
            id={id}
            name="month"
            value={month ?? ''}
            onChange={(e) => setMonth(e.target.value ? Number(e.target.value) : null)}
            className="w-full appearance-none bg-transparent pr-6 text-sm font-medium focus:outline-none"
          >
            <option value="">Any month</option>
            {MONTHS.map((m, i) => (
              <option key={m} value={i + 1}>
                {new Date(2000, i).toLocaleString('en-GB', { month: 'long' })}
              </option>
            ))}
          </select>
        )}
      </Row>
      <Row icon={<Compass className="size-5" strokeWidth={1.5} />} label="In the mood for">
        {(id) => (
          <select
            id={id}
            name="vibe"
            value={vibe ?? ''}
            onChange={(e) => setVibe((e.target.value || null) as Vibe | null)}
            className="w-full appearance-none bg-transparent pr-6 text-sm font-medium focus:outline-none"
          >
            <option value="">Anything</option>
            {(Object.keys(VIBE_LABELS) as Vibe[]).map((v) => (
              <option key={v} value={v}>
                {VIBE_LABELS[v]}
              </option>
            ))}
          </select>
        )}
      </Row>

      <p className="mt-4 text-xs text-ink-soft" aria-live="polite">
        {count === 0 ? 'Nothing fits yet. Try another month.' : `${count} ${count === 1 ? 'place' : 'places'} match`}
      </p>
      <button type="submit" className="btn-dark mt-3 w-full">
        Show destinations <ArrowRight className="size-4" aria-hidden="true" />
      </button>
    </form>
  );
}

function Row({ icon, label, children }: { icon: ReactNode; label: string; children: (id: string) => ReactNode }) {
  const id = useId();
  return (
    <div className="flex items-center gap-3 border-b border-line py-3 first:pt-0">
      <span className="text-ink-soft" aria-hidden="true">
        {icon}
      </span>
      <div className="relative min-w-0 flex-1">
        <label htmlFor={id} className="block text-xs text-ink-soft">
          {label}
        </label>
        {children(id)}
        <ChevronDown className="pointer-events-none absolute right-0 bottom-0.5 size-4 text-ink-soft" aria-hidden="true" />
      </div>
    </div>
  );
}
