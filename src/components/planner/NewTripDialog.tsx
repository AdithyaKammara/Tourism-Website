import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { starterPacking } from '../../lib/planner/packing';
import { usePlanner } from '../../lib/planner/store';
import { Dialog, Field, useDestinations } from './ui';

type Props = { open: boolean; presetId: string | null; onClose: () => void; onCreated: (id: string) => void };

export default function NewTripDialog({ open, presetId, onClose, onCreated }: Props) {
  const destinations = useDestinations();
  const createTrip = usePlanner((s) => s.createTrip);
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [travellers, setTravellers] = useState(2);
  const [picked, setPicked] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Reset the form each time it opens, pre-selecting the destination it was opened for.
  useEffect(() => {
    if (!open) return;
    const preset = presetId ? destinations.get(presetId) : undefined;
    setTitle(preset ? `${preset.name} trip` : '');
    setStartDate('');
    setTravellers(2);
    setPicked(preset ? [preset.id] : []);
    setError(null);
  }, [open, presetId, destinations]);

  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  return (
    <Dialog open={open} onClose={onClose} title="New trip">
      <form
        noValidate
        className="space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          if (!title.trim()) return setError('Give your trip a name');
          const places = picked.map((id) => destinations.get(id)).filter((d) => d !== undefined);
          const id = createTrip({
            title: title.trim(),
            startDate: startDate || undefined,
            travellers: Math.min(50, Math.max(1, travellers || 1)),
            stops: places.map((d) => ({ destinationId: d.id, days: d.daysNeeded.min })),
            packing: starterPacking(places.flatMap((d) => d.vibes)),
          });
          onCreated(id);
        }}
      >
        <div>
          <Field
            label="Trip name"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setError(null);
            }}
            placeholder="Kerala in December"
            maxLength={120}
            aria-invalid={Boolean(error) || undefined}
            autoFocus
          />
          {error && (
            <p className="mt-1 text-xs text-red-700 dark:text-red-400" role="alert">
              {error}
            </p>
          )}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Start date (optional)" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          <Field
            label="Travellers"
            type="number"
            min={1}
            max={50}
            value={travellers}
            onChange={(e) => setTravellers(Number(e.target.value))}
          />
        </div>

        <fieldset>
          <legend className="mb-2 text-xs font-medium text-ink-soft">Where are you going? (optional)</legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {[...destinations.values()].map((d) => {
              const on = picked.includes(d.id);
              return (
                <button
                  key={d.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggle(d.id)}
                  className="relative flex items-center gap-2 rounded-xl border border-line p-2 text-left text-sm transition-colors hover:border-ink aria-pressed:border-accent aria-pressed:bg-sage-soft"
                >
                  <img src={d.image.src} alt="" className="size-9 rounded-lg object-cover" />
                  <span className="min-w-0 truncate">{d.name}</span>
                  {on && <Check className="absolute top-1 right-1 size-3.5 text-accent" aria-hidden="true" />}
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-ink-soft">
            We’ll add the suggested number of days for each place and a packing list to match.
          </p>
        </fieldset>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-outline" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn-dark">
            Create trip
          </button>
        </div>
      </form>
    </Dialog>
  );
}
