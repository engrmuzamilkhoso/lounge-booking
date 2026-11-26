import { ShieldAlert } from 'lucide-react';
import { ButtonLink } from '@/components/ui/button';
import { cn } from '@/lib/cn';

/** Shown when the user lacks the permission for an admin page. */
export function AccessDenied({ fullPage = false }: { fullPage?: boolean }) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 p-8 text-center',
        fullPage && 'min-h-screen bg-stone-50',
      )}
    >
      <ShieldAlert aria-hidden className="size-10 text-gold-600" />
      <h1 className="text-xl font-semibold">You don&apos;t have access to this page</h1>
      <p className="max-w-md text-sm text-stone-600">
        Ask an administrator to give your role the permission you need.
      </p>
      <ButtonLink href={fullPage ? '/' : '/admin'} variant="secondary" className="mt-2">
        {fullPage ? 'Back to website' : 'Back to dashboard'}
      </ButtonLink>
    </div>
  );
}
