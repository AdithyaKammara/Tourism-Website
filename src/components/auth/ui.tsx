import { useId, useState, type InputHTMLAttributes, type ReactNode } from 'react';
import { isInputError, type ActionError } from 'astro:actions';

type FieldErrors = Record<string, string[] | undefined>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SafeResult<T> = { data?: T; error?: ActionError<any> };

/**
 * Runs an Astro action and tracks pending state and errors.
 * `pending` holds the key of the running call, so forms with several buttons can show which one is busy.
 */
export function useAction() {
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  async function run<T>(key: string, call: () => Promise<SafeResult<T>>, onSuccess: (data: T) => void) {
    setPending(key);
    setError(null);
    setFieldErrors({});
    try {
      const result = await call();
      if (result.error) {
        if (isInputError(result.error)) setFieldErrors(result.error.fields);
        else setError(result.error.message);
        return;
      }
      onSuccess(result.data as T);
    } catch {
      setError('Something went wrong. Check your connection and try again.');
    } finally {
      setPending(null);
    }
  }

  return { run, pending, error, fieldErrors };
}

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  name: string;
  errors?: string[];
  aside?: ReactNode;
};

export function Field({ label, name, errors, aside, ...input }: FieldProps) {
  const id = useId();
  const errorId = `${id}-error`;
  const hasError = Boolean(errors?.length);

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <label htmlFor={id} className="eyebrow">
          {label}
        </label>
        {aside}
      </div>
      <input
        id={id}
        name={name}
        aria-invalid={hasError || undefined}
        aria-describedby={hasError ? errorId : undefined}
        className="mt-1 w-full border-0 border-b border-line bg-transparent py-3 text-lg text-ink transition-colors placeholder:text-ink-soft/60 focus:border-ink focus:outline-none aria-invalid:border-accent"
        {...input}
      />
      {hasError && (
        <p id={errorId} className="mt-2 text-sm text-accent">
          {errors![0]}
        </p>
      )}
    </div>
  );
}

export function PrimaryButton({ busy, children }: { busy: boolean; children: ReactNode }) {
  return (
    <button
      type="submit"
      disabled={busy}
      className="btn-dark w-full py-3.5 disabled:cursor-wait disabled:opacity-60"
    >
      {children}
    </button>
  );
}

export function SecondaryButton({
  busy,
  onClick,
  children,
}: {
  busy: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={busy}
      onClick={onClick}
      className="flex w-full items-center justify-center gap-3 rounded-full border border-line px-6 py-3.5 text-sm font-medium transition-colors hover:border-ink disabled:cursor-wait disabled:opacity-60"
    >
      {children}
    </button>
  );
}

export function FormAlert({ tone = 'error', children }: { tone?: 'error' | 'success'; children: ReactNode }) {
  return (
    <p
      role={tone === 'error' ? 'alert' : 'status'}
      className={
        tone === 'error'
          ? 'border-l-2 border-accent py-1 pl-4 text-sm text-accent'
          : 'border-l-2 border-moss py-1 pl-4 text-sm text-moss'
      }
    >
      {children}
    </p>
  );
}

export function Divider({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-4 text-xs text-ink-soft" aria-hidden="true">
      <span className="h-px flex-1 bg-line" />
      {children}
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}
