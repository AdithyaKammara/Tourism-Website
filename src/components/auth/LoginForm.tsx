import { useRef, useState } from 'react';
import { actions } from 'astro:actions';
import { Divider, Field, FormAlert, PrimaryButton, SecondaryButton, useAction } from './ui';

export default function LoginForm({ next, notice }: { next?: string; notice?: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const { run, pending, error, fieldErrors } = useAction();
  const [linkSentTo, setLinkSentTo] = useState<string | null>(null);

  const formData = () => new FormData(formRef.current!);

  if (linkSentTo) {
    return (
      <FormAlert tone="success">
        Check <strong>{linkSentTo}</strong> for a sign-in link. You can close this tab.
      </FormAlert>
    );
  }

  return (
    <form
      ref={formRef}
      noValidate
      className="space-y-7"
      onSubmit={(e) => {
        e.preventDefault();
        run('password', () => actions.auth.login(formData()), (d) => window.location.assign(d.redirectTo));
      }}
    >
      {notice && !error && <FormAlert>{notice}</FormAlert>}
      {error && <FormAlert>{error}</FormAlert>}
      <input type="hidden" name="next" value={next ?? ''} />

      <Field label="Email" name="email" type="email" autoComplete="email" required errors={fieldErrors.email} />
      <Field
        label="Password"
        name="password"
        type="password"
        autoComplete="current-password"
        required
        errors={fieldErrors.password}
        aside={
          <a href="/forgot-password" className="text-xs underline underline-offset-4 hover:text-accent">
            Forgot it?
          </a>
        }
      />

      <PrimaryButton busy={pending !== null}>{pending === 'password' ? 'Signing in…' : 'Log in'}</PrimaryButton>

      <Divider>or</Divider>

      <div className="space-y-3">
        <SecondaryButton
          busy={pending !== null}
          onClick={() =>
            run('link', () => actions.auth.magicLink(formData()), (d) => setLinkSentTo(d.sentTo))
          }
        >
          {pending === 'link' ? 'Sending…' : 'Email me a sign-in link'}
        </SecondaryButton>
        <SecondaryButton
          busy={pending !== null}
          onClick={() => run('google', () => actions.auth.google(formData()), (d) => window.location.assign(d.url))}
        >
          <GoogleMark />
          {pending === 'google' ? 'Opening Google…' : 'Continue with Google'}
        </SecondaryButton>
      </div>
    </form>
  );
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
      <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.2-2.1 3.5-5.2 3.5-8.8Z" />
      <path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.3v3.1A12 12 0 0 0 12 24Z" />
      <path fill="#FBBC05" d="M5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.6h-4a12 12 0 0 0 0 10.8l4-3.1Z" />
      <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.3 6.6l4 3.1c.9-2.9 3.6-4.9 6.7-4.9Z" />
    </svg>
  );
}
