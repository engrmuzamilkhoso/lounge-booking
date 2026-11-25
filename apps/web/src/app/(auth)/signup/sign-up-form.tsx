'use client';

import Link from 'next/link';
import { TextField } from '@/components/forms/text-field';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { signUpAction } from '@/lib/actions/auth-actions';
import { useActionForm } from '@/lib/forms/use-action-form';
import { signUpSchema } from '@/lib/validation/auth';

export function SignUpForm({ returnTo }: { returnTo: string | null }) {
  const { form, submit, isSubmitting, formError } = useActionForm({
    schema: signUpSchema,
    defaultValues: { firstName: '', lastName: '', email: '', cnic: '', contact: '', password: '' },
    action: (values) => signUpAction(values, returnTo),
  });

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-5">
      {formError !== null && <Alert tone="error">{formError}</Alert>}
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          form={form}
          name="firstName"
          label="First name"
          autoComplete="given-name"
          required
        />
        <TextField
          form={form}
          name="lastName"
          label="Last name"
          autoComplete="family-name"
          required
        />
      </div>
      <TextField
        form={form}
        name="email"
        label="Email"
        type="email"
        autoComplete="email"
        required
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField form={form} name="cnic" label="CNIC / passport" required />
        <TextField
          form={form}
          name="contact"
          label="Phone"
          type="tel"
          autoComplete="tel"
          required
        />
      </div>
      <TextField
        form={form}
        name="password"
        label="Password"
        type="password"
        autoComplete="new-password"
        hint="At least 6 characters."
        required
      />
      <Button type="submit" size="lg" isLoading={isSubmitting} className="w-full">
        Create account
      </Button>
      <p className="text-center text-xs text-stone-500">
        By creating an account you agree to our{' '}
        <Link href="/terms" className="underline hover:text-espresso-900">
          Terms &amp; Conditions
        </Link>{' '}
        and{' '}
        <Link href="/privacy" className="underline hover:text-espresso-900">
          Privacy Policy
        </Link>
        .
      </p>
    </form>
  );
}
