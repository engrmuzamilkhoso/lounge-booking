import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AuthDivider, AuthHeading } from '@/components/auth/auth-heading';
import { GoogleSignInButton } from '@/components/auth/google-sign-in-button';
import { getCurrentUser } from '@/lib/auth/current-user';
import { safeReturnPath } from '@/lib/auth/safe-redirect';
import { SignUpForm } from './sign-up-form';

export const metadata: Metadata = {
  title: 'Create an account',
  description: 'Create a Majestic Lounge account to book airport services.',
};

export default async function SignUpPage({ searchParams }: PageProps<'/signup'>) {
  const { next } = await searchParams;
  const returnTo = typeof next === 'string' ? next : null;

  if ((await getCurrentUser()) !== null) {
    redirect(safeReturnPath(returnTo, '/services'));
  }

  const signInHref = returnTo === null ? '/signin' : `/signin?next=${encodeURIComponent(returnTo)}`;

  return (
    <>
      <AuthHeading
        title="Create your account"
        description={
          <>
            Already have an account?{' '}
            <Link href={signInHref} className="font-semibold text-gold-600 hover:text-gold-700">
              Sign in
            </Link>
          </>
        }
      />
      <GoogleSignInButton mode="signup" returnTo={returnTo} />
      <AuthDivider />
      <SignUpForm returnTo={returnTo} />
    </>
  );
}
