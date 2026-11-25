import type { ReactNode } from 'react';
import { isGoogleSignInEnabled } from '@/lib/auth/google-config';

export function AuthHeading({ title, description }: { title: string; description: ReactNode }) {
  return (
    <div className="mb-8">
      <h1 className="text-2xl font-semibold sm:text-3xl">{title}</h1>
      <p className="mt-2 text-sm text-stone-600">{description}</p>
    </div>
  );
}

/** "or" line between the Google button and the email form (only when Google is enabled). */
export function AuthDivider() {
  if (!isGoogleSignInEnabled) {
    return null;
  }
  return (
    <div className="my-6 flex items-center gap-3 text-xs font-medium tracking-wide text-stone-400 uppercase">
      <span className="h-px flex-1 bg-stone-200" />
      or with email
      <span className="h-px flex-1 bg-stone-200" />
    </div>
  );
}
