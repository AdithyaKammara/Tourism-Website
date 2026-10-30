import { useState } from 'react';
import { actions } from 'astro:actions';
import { Field, FormAlert, PrimaryButton, useAction } from './ui';

export default function SignupForm() {
  const { run, pending, error, fieldErrors } = useAction();
  const [confirmEmail, setConfirmEmail] = useState<string | null>(null);

  if (confirmEmail) {
    return (
      <FormAlert tone="success">
        Almost there. We sent a confirmation link to <strong>{confirmEmail}</strong>. Open it to finish
        creating your account.
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
        run('signup', () => actions.auth.signup(data), (d) => {
          if (d.needsConfirmation) setConfirmEmail(d.email);
          else window.location.assign('/account');
        });
      }}
    >
      {error && <FormAlert>{error}</FormAlert>}
      <Field label="Your name" name="name" autoComplete="name" required errors={fieldErrors.name} />
      <Field label="Email" name="email" type="email" autoComplete="email" required errors={fieldErrors.email} />
      <Field
        label="Password"
        name="password"
        type="password"
        autoComplete="new-password"
        minLength={8}
        required
        placeholder="At least 8 characters"
        errors={fieldErrors.password}
      />
      <PrimaryButton busy={pending !== null}>{pending ? 'Creating account…' : 'Create account'}</PrimaryButton>
    </form>
  );
}
