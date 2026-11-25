import { LoaderCircle } from 'lucide-react';
import { cn } from '@/lib/cn';

interface SpinnerProps {
  className?: string;
  /** Read by screen readers; leave out when a visible label already describes the wait. */
  label?: string;
}

export function Spinner({ className, label }: SpinnerProps) {
  return (
    <span role={label === undefined ? undefined : 'status'} className="inline-flex items-center">
      <LoaderCircle aria-hidden className={cn('size-4 animate-spin', className)} />
      {label !== undefined && <span className="sr-only">{label}</span>}
    </span>
  );
}
