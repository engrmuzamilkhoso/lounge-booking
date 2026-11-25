'use client';

import { CircleCheck } from 'lucide-react';
import { useState } from 'react';
import { TextField } from '@/components/forms/text-field';
import { Alert } from '@/components/ui/alert';
import { Button, ButtonLink } from '@/components/ui/button';
import { resetPasswordAction } from '@/lib/actions/auth-actions';
import { useActionForm } from '@/lib/forms/use-action-form';
import { resetPasswordSchema } from '@/lib/validation/auth';

export function ResetPasswordForm({ resetToken }: { resetToken: string }) {
  const [isDone, setIsDone] = useState(false);
  const { form, submit, isSubmitting, formError } = useActionForm({
    schema: resetPasswordSchema,
    defaultValues: { password: '', confirmPassword: '' },
    action: (values) => resetPasswordAction(resetToken, values),
    onSuccess: () => {
      setIsDone(true);
    },
  });

  if (isDone) {
    return (
      <div className="rounded-card border border-stone-200 bg-white p-6 text-center shadow-card">
        <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
          <CircleCheck aria-hidden className="size-6" />
        </span>
        <h2 className="mt-4 text-lg font-semibold">Password updated</h2>
        <p className="mt-2 text-sm text-stone-600">You can now sign in with your new password.</p>
        <ButtonLink href="/signin" className="mt-6 w-full">
          Sign in
        </ButtonLink>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-5">
      {formError !== null && <Alert tone="error">{formError}</Alert>}
      <TextField
        form={form}
        name="password"
        label="New password"
        type="password"
        autoComplete="new-password"
        hint="At least 6 characters."
        required
      />
      <TextField
        form={form}
        name="confirmPassword"
        label="Confirm new password"
        type="password"
        autoComplete="new-password"
        required
      />
      <Button type="submit" size="lg" isLoading={isSubmitting} className="w-full">
        Update password
      </Button>
    </form>
  );
}
