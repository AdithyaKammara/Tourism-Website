import { createContext, useContext, useEffect, useId, useRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { X } from 'lucide-react';
import type { DestinationCard } from '../../lib/destinations';
import type { SyncStatus } from '../../lib/planner/sync';

export const DestinationsContext = createContext<Map<string, DestinationCard>>(new Map());
export const useDestinations = () => useContext(DestinationsContext);

export const inputClass =
  'w-full rounded-xl border border-line bg-card px-3 py-2.5 text-sm text-ink placeholder:text-ink-soft/70 focus:border-ink focus:outline-none';

export function Field({ label, hint, ...input }: InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs font-medium text-ink-soft">
        {label}
      </label>
      <input id={id} className={inputClass} {...input} />
      {hint && <p className="mt-1 text-xs text-ink-soft">{hint}</p>}
    </div>
  );
}

/** A native <dialog> so focus trapping, Escape and the backdrop come for free. */
export function Dialog({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      className="m-auto w-[min(36rem,calc(100vw-2rem))] rounded-3xl bg-paper p-0 text-ink shadow-soft backdrop:bg-forest/50 backdrop:backdrop-blur-sm"
    >
      <div className="max-h-[85vh] overflow-y-auto p-6 md:p-8">
        <div className="mb-6 flex items-start justify-between gap-4">
          <h2 id={titleId} className="font-display text-3xl">
            {title}
          </h2>
          <button type="button" onClick={onClose} aria-label="Close" className="grid size-9 place-items-center rounded-full hover:bg-paper-deep">
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}

const STATUS_TEXT: Record<SyncStatus, string> = {
  device: 'Saved on this device',
  loading: 'Loading your trips…',
  saving: 'Saving…',
  saved: 'Saved to your account',
  'not-set-up': 'Saved on this device (cloud saving isn’t set up yet)',
  error: 'Couldn’t reach the server. Saved on this device for now.',
};

export function SyncBadge({ status }: { status: SyncStatus }) {
  const tone = status === 'error' ? 'bg-amber-500' : status === 'saving' || status === 'loading' ? 'bg-ink-soft animate-pulse' : 'bg-accent';
  return (
    <p className="flex items-center gap-2 text-xs text-ink-soft" role="status">
      <span className={`size-2 rounded-full ${tone}`} aria-hidden="true" />
      {STATUS_TEXT[status]}
    </p>
  );
}

export function EmptyNote({ children }: { children: ReactNode }) {
  return <p className="rounded-2xl border border-dashed border-line px-4 py-6 text-center text-sm text-ink-soft">{children}</p>;
}
