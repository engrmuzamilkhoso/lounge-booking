import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface FormFieldProps {
  /** Id of the input; used to connect the label, hint and error message. */
  id: string;
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  className?: string;
  children: ReactNode;
}

/**
 * Label + input + hint/error, with the accessibility wiring done once:
 * the input should set `aria-describedby={describedBy(id, hint, error)}` and `aria-invalid`.
 */
export function FormField({
  id,
  label,
  required,
  hint,
  error,
  className,
  children,
}: FormFieldProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className="text-sm font-medium text-espresso-900">
        {label}
        {required === true && (
          <span className="ml-0.5 text-red-700" aria-hidden>
            *
          </span>
        )}
      </label>
      {children}
      {hint !== undefined && error === undefined && (
        <p id={`${id}-hint`} className="text-xs text-stone-500">
          {hint}
        </p>
      )}
      {error !== undefined && (
        <p id={`${id}-error`} role="alert" className="text-xs font-medium text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}

/** The `aria-describedby` value for an input inside a FormField. */
export function describedBy(id: string, hint?: string, error?: string): string | undefined {
  if (error !== undefined) {
    return `${id}-error`;
  }
  if (hint !== undefined) {
    return `${id}-hint`;
  }
  return undefined;
}
