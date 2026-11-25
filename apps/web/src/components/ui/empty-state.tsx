import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  /** Usually one ButtonLink pointing at the next useful step. */
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center rounded-card border border-dashed border-stone-300 bg-white px-6 py-12 text-center',
        className,
      )}
    >
      <span className="mb-4 flex size-12 items-center justify-center rounded-full bg-gold-50 text-gold-600">
        <Icon aria-hidden className="size-6" />
      </span>
      <h3 className="text-base font-semibold">{title}</h3>
      {description !== undefined && (
        <p className="mt-1 max-w-sm text-sm text-stone-500">{description}</p>
      )}
      {action !== undefined && <div className="mt-6">{action}</div>}
    </div>
  );
}
