import { actions } from 'astro:actions';
import { Field, FormAlert, PrimaryButton, useAction } from './ui';

export default function ResetPasswordForm() {
  const { run, pending, error, fieldErrors } = useAction();

  return (
    <form
      noValidate
      className="space-y-7"
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        run('update', () => actions.auth.updatePassword(data), (d) => window.location.assign(d.redirectTo));
      }}
    >
      {error && <FormAlert>{error}</FormAlert>}
      <Field
        label="New password"
        name="password"
        type="password"
        autoComplete="new-password"
        minLength={8}
        required
        errors={fieldErrors.password}
      />
      <Field
        label="Confirm password"
        name="confirm"
        type="password"
        autoComplete="new-password"
        required
        errors={fieldErrors.confirm}
      />
      <PrimaryButton busy={pending !== null}>{pending ? 'Saving…' : 'Save new password'}</PrimaryButton>
    </form>
  );
}
