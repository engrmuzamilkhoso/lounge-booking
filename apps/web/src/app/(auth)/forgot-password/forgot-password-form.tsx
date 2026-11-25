'use client';

import { MailCheck } from 'lucide-react';
import { useState } from 'react';
import { TextField } from '@/components/forms/text-field';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { forgotPasswordAction } from '@/lib/actions/auth-actions';
import { useActionForm } from '@/lib/forms/use-action-form';
import { forgotPasswordSchema } from '@/lib/validation/auth';

export function ForgotPasswordForm() {
  const [sentTo, setSentTo] = useState<string | null>(null);
  const { form, submit, isSubmitting, formError } = useActionForm({
    schema: forgotPasswordSchema,
    defaultValues: { email: '' },
    action: forgotPasswordAction,
    onSuccess: () => {
      setSentTo(form.getValues('email'));
    },
  });

  if (sentTo !== null) {
    // Same message whether or not the email has an account, so the form reveals nothing.
    return (
      <div className="rounded-card border border-stone-200 bg-white p-6 text-center shadow-card">
        <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-gold-50 text-gold-600">
          <MailCheck aria-hidden className="size-6" />
        </span>
        <h2 className="mt-4 text-lg font-semibold">Check your inbox</h2>
        <p className="mt-2 text-sm text-stone-600">
          If <span className="font-medium text-espresso-900">{sentTo}</span> has a Majestic account,
          a reset link is on its way. The link is valid for 60 minutes.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-5">
      {formError !== null && <Alert tone="error">{formError}</Alert>}
      <TextField
        form={form}
        name="email"
        label="Email"
        type="email"
        autoComplete="email"
        required
      />
      <Button type="submit" size="lg" isLoading={isSubmitting} className="w-full">
        Send reset link
      </Button>
    </form>
  );
}
