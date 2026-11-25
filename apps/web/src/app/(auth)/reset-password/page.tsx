import type { Metadata } from 'next';
import Link from 'next/link';
import { AuthHeading } from '@/components/auth/auth-heading';
import { Alert } from '@/components/ui/alert';
import { ResetPasswordForm } from './reset-password-form';

export const metadata: Metadata = {
  title: 'Choose a new password',
  robots: { index: false },
};

/** Opened from the emailed link: /reset-password?token=… */
export default async function ResetPasswordPage({ searchParams }: PageProps<'/reset-password'>) {
  const { token } = await searchParams;

  if (typeof token !== 'string' || token === '') {
    return (
      <>
        <AuthHeading title="Link not valid" description="This password reset link is incomplete." />
        <Alert tone="warning">
          Request a new link from the{' '}
          <Link href="/forgot-password" className="font-semibold underline">
            forgot password
          </Link>{' '}
          page.
        </Alert>
      </>
    );
  }

  return (
    <>
      <AuthHeading
        title="Choose a new password"
        description="For your security, you will be signed out of all other devices."
      />
      <ResetPasswordForm resetToken={token} />
    </>
  );
}
