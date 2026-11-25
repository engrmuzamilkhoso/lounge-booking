import { CircleAlert, CircleCheck, Info, TriangleAlert } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export type AlertTone = 'info' | 'success' | 'warning' | 'error';

const toneStyles: Record<AlertTone, { classes: string; Icon: typeof Info }> = {
  info: { classes: 'border-sky-200 bg-sky-50 text-sky-900', Icon: Info },
  success: { classes: 'border-emerald-200 bg-emerald-50 text-emerald-900', Icon: CircleCheck },
  warning: { classes: 'border-amber-200 bg-amber-50 text-amber-900', Icon: TriangleAlert },
  error: { classes: 'border-red-200 bg-red-50 text-red-900', Icon: CircleAlert },
};

interface AlertProps {
  tone?: AlertTone;
  title?: string;
  className?: string;
  children?: ReactNode;
}

/** Inline message inside a page or form. Errors are announced to screen readers. */
export function Alert({ tone = 'info', title, className, children }: AlertProps) {
  const { classes, Icon } = toneStyles[tone];
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={cn('flex gap-3 rounded-lg border px-4 py-3 text-sm', classes, className)}
    >
      <Icon aria-hidden className="mt-0.5 size-4 shrink-0" />
      <div className="flex flex-col gap-1">
        {title !== undefined && <p className="font-medium">{title}</p>}
        {children !== undefined && <div>{children}</div>}
      </div>
    </div>
  );
}
