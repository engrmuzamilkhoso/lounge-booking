import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AuthDivider, AuthHeading } from '@/components/auth/auth-heading';
import { GoogleSignInButton } from '@/components/auth/google-sign-in-button';
import { getCurrentUser } from '@/lib/auth/current-user';
import { safeReturnPath } from '@/lib/auth/safe-redirect';
import { SignInForm } from './sign-in-form';

export const metadata: Metadata = {
  title: 'Sign in',
  description: 'Sign in to book Majestic Lounge services and manage your bookings.',
};

export default async function SignInPage({ searchParams }: PageProps<'/signin'>) {
  const { next } = await searchParams;
  const returnTo = typeof next === 'string' ? next : null;

  // Already signed in: go where the visitor was heading.
  if ((await getCurrentUser()) !== null) {
    redirect(safeReturnPath(returnTo, '/services'));
  }

  const signUpHref = returnTo === null ? '/signup' : `/signup?next=${encodeURIComponent(returnTo)}`;

  return (
    <>
      <AuthHeading
        title="Welcome back"
        description={
          <>
            New to Majestic?{' '}
            <Link href={signUpHref} className="font-semibold text-gold-600 hover:text-gold-700">
              Create an account
            </Link>
          </>
        }
      />
      <GoogleSignInButton mode="signin" returnTo={returnTo} />
      <AuthDivider />
      <SignInForm returnTo={returnTo} />
    </>
  );
}
