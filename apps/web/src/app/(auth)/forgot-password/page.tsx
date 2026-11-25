import type { Metadata } from 'next';
import Link from 'next/link';
import { AuthHeading } from '@/components/auth/auth-heading';
import { ForgotPasswordForm } from './forgot-password-form';

export const metadata: Metadata = {
  title: 'Forgot password',
  robots: { index: false },
};

export default function ForgotPasswordPage() {
  return (
    <>
      <AuthHeading
        title="Reset your password"
        description="Enter the email you use for Majestic and we will send you a link to choose a new password."
      />
      <ForgotPasswordForm />
      <p className="mt-6 text-center text-sm text-stone-600">
        Remembered it?{' '}
        <Link href="/signin" className="font-semibold text-gold-600 hover:text-gold-700">
          Back to sign in
        </Link>
      </p>
    </>
  );
}
