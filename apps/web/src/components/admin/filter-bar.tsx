import { Search } from 'lucide-react';
import type { ReactNode } from 'react';
import { buttonClasses } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface FilterBarProps {
  /** Current search text. */
  search?: string;
  searchPlaceholder: string;
  /** Extra filters (selects, dates) placed before the button; their `name`s become URL params. */
  children?: ReactNode;
}

/** A GET form: filters live in the URL, so they survive refreshes and can be shared. */
export function FilterBar({ search, searchPlaceholder, children }: FilterBarProps) {
  return (
    <form method="get" role="search" className="mb-4 flex flex-wrap items-end gap-3">
      <div className="min-w-56 flex-1">
        <label htmlFor="admin-search" className="sr-only">
          Search
        </label>
        <Input
          id="admin-search"
          type="search"
          name="search"
          defaultValue={search}
          placeholder={searchPlaceholder}
        />
      </div>
      {children}
      <button type="submit" className={buttonClasses('secondary', 'md')}>
        <Search aria-hidden className="size-4" />
        Search
      </button>
    </form>
  );
}
