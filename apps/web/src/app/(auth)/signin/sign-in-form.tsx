'use client';

import Link from 'next/link';
import { TextField } from '@/components/forms/text-field';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { signInAction } from '@/lib/actions/auth-actions';
import { useActionForm } from '@/lib/forms/use-action-form';
import { signInSchema } from '@/lib/validation/auth';

export function SignInForm({ returnTo }: { returnTo: string | null }) {
  const { form, submit, isSubmitting, formError } = useActionForm({
    schema: signInSchema,
    defaultValues: { email: '', password: '' },
    action: (values) => signInAction(values, returnTo),
  });

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
      <div className="flex flex-col gap-1.5">
        <TextField
          form={form}
          name="password"
          label="Password"
          type="password"
          autoComplete="current-password"
          required
        />
        <Link
          href="/forgot-password"
          className="self-end text-sm font-medium text-gold-600 hover:text-gold-700"
        >
          Forgot password?
        </Link>
      </div>
      <Button type="submit" size="lg" isLoading={isSubmitting} className="w-full">
        Sign in
      </Button>
    </form>
  );
}
