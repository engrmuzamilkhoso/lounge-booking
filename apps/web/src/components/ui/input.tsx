import type { ComponentProps } from 'react';
import { cn } from '@/lib/cn';

export const controlClasses =
  'w-full rounded-lg border bg-white px-3.5 text-sm text-espresso-900 placeholder:text-stone-400 ' +
  'transition-colors focus:outline-none focus:ring-2 focus:ring-gold-300 focus:border-gold-500 ' +
  'disabled:cursor-not-allowed disabled:bg-stone-100 disabled:text-stone-500';

function borderClass(invalid: ComponentProps<'input'>['aria-invalid']): string {
  const isInvalid = invalid === true || invalid === 'true';
  if (isInvalid) {
    return 'border-red-600 focus:ring-red-200 focus:border-red-600';
  }
  return 'border-stone-300 hover:border-stone-400';
}

export function Input({ className, ...props }: ComponentProps<'input'>) {
  return (
    <input
      className={cn(controlClasses, 'h-11', borderClass(props['aria-invalid']), className)}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }: ComponentProps<'textarea'>) {
  return (
    <textarea
      className={cn(
        controlClasses,
        'min-h-28 py-2.5',
        borderClass(props['aria-invalid']),
        className,
      )}
      {...props}
    />
  );
}

export function Select({ className, children, ...props }: ComponentProps<'select'>) {
  return (
    <select
      className={cn(controlClasses, 'h-11 pr-8', borderClass(props['aria-invalid']), className)}
      {...props}
    >
      {children}
    </select>
  );
}
