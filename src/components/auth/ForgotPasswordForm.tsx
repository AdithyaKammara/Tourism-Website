import { useState } from 'react';
import { actions } from 'astro:actions';
import { Field, FormAlert, PrimaryButton, useAction } from './ui';

export default function ForgotPasswordForm() {
  const { run, pending, error, fieldErrors } = useAction();
  const [sentTo, setSentTo] = useState<string | null>(null);

  if (sentTo) {
    return (
      <FormAlert tone="success">
        If an account exists for <strong>{sentTo}</strong>, a reset link is on its way.
      </FormAlert>
    );
  }

  return (
    <form
      noValidate
      className="space-y-7"
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        run('reset', () => actions.auth.requestReset(data), (d) => setSentTo(d.sentTo));
      }}
    >
      {error && <FormAlert>{error}</FormAlert>}
      <Field label="Email" name="email" type="email" autoComplete="email" required errors={fieldErrors.email} />
      <PrimaryButton busy={pending !== null}>{pending ? 'Sending…' : 'Send reset link'}</PrimaryButton>
    </form>
  );
}
