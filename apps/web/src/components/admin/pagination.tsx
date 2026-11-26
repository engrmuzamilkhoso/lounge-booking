import type { PaginationMeta } from '@booking/shared-types';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/cn';

interface PaginationProps {
  meta: PaginationMeta;
  /** Current filters, kept when moving between pages. */
  basePath: string;
  params: Record<string, string | undefined>;
}

/** "Showing 21–40 of 132" with previous/next links. Works without JavaScript. */
export function Pagination({ meta, basePath, params }: PaginationProps) {
  const pageCount = Math.max(1, Math.ceil(meta.total / meta.pageSize));
  if (meta.total === 0) {
    return null;
  }
  const first = (meta.page - 1) * meta.pageSize + 1;
  const last = Math.min(meta.page * meta.pageSize, meta.total);

  return (
    <nav
      aria-label="Pages"
      className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-stone-600"
    >
      <p>
        Showing {first}–{last} of {meta.total}
      </p>
      <div className="flex items-center gap-2">
        <PageLink
          href={pageHref(basePath, params, meta.page - 1)}
          isDisabled={meta.page <= 1}
          label="Previous"
        >
          <ChevronLeft aria-hidden className="size-4" />
        </PageLink>
        <span>
          Page {meta.page} of {pageCount}
        </span>
        <PageLink
          href={pageHref(basePath, params, meta.page + 1)}
          isDisabled={meta.page >= pageCount}
          label="Next"
        >
          <ChevronRight aria-hidden className="size-4" />
        </PageLink>
      </div>
    </nav>
  );
}

function PageLink({
  href,
  isDisabled,
  label,
  children,
}: {
  href: string;
  isDisabled: boolean;
  label: string;
  children: React.ReactNode;
}) {
  const classes = 'flex size-9 items-center justify-center rounded-lg border border-stone-200';
  if (isDisabled) {
    return (
      <span aria-disabled className={cn(classes, 'text-stone-300')}>
        <span className="sr-only">{label}</span>
        {children}
      </span>
    );
  }
  return (
    <Link href={href} className={cn(classes, 'bg-white hover:bg-stone-100')} aria-label={label}>
      {children}
    </Link>
  );
}

function pageHref(basePath: string, params: Record<string, string | undefined>, page: number) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '' && key !== 'page' && key !== 'notice') {
      search.set(key, value);
    }
  }
  search.set('page', String(page));
  return `${basePath}?${search.toString()}`;
}
