import { cn } from '@/lib/cn';

/** Grey placeholder block shown while content loads. */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn('animate-pulse rounded-md bg-stone-200/70', className)} />;
}
