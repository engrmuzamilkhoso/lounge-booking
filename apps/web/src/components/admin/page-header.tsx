import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  /** Link back to the parent page, e.g. the list from an edit form. */
  back?: { href: string; label: string };
  /** Buttons on the right, e.g. "New booking". */
  actions?: ReactNode;
}

export function PageHeader({ title, description, back, actions }: PageHeaderProps) {
  return (
    <div className="mb-6">
      {back !== undefined && (
        <Link
          href={back.href}
          className="mb-2 inline-flex items-center gap-1 text-sm text-stone-500 hover:text-espresso-900"
        >
          <ChevronLeft aria-hidden className="size-4" />
          {back.label}
        </Link>
      )}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{title}</h1>
          {description !== undefined && (
            <p className="mt-1 text-sm text-stone-600">{description}</p>
          )}
        </div>
        {actions !== undefined && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
    </div>
  );
}
