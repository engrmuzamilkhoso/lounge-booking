import { Inbox } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface Column<TRow> {
  header: string;
  cell: (row: TRow) => ReactNode;
  /** e.g. "text-right" for amounts, "hidden md:table-cell" for less important columns. */
  className?: string;
}

interface DataTableProps<TRow> {
  columns: Column<TRow>[];
  rows: TRow[];
  rowKey: (row: TRow) => string | number;
  emptyMessage: string;
}

/** A plain, responsive table: scrolls sideways on small screens. */
export function DataTable<TRow>({ columns, rows, rowKey, emptyMessage }: DataTableProps<TRow>) {
  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-card border border-dashed border-stone-300 bg-white p-10 text-center">
        <Inbox aria-hidden className="size-8 text-stone-400" />
        <p className="text-sm text-stone-600">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-card border border-stone-200 bg-white shadow-card">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-stone-200 bg-stone-50 text-xs tracking-wide text-stone-500 uppercase">
          <tr>
            {columns.map((column) => (
              <th
                key={column.header}
                scope="col"
                className={cn('px-4 py-3 font-semibold whitespace-nowrap', column.className)}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100">
          {rows.map((row) => (
            <tr key={rowKey(row)} className="hover:bg-stone-50/70">
              {columns.map((column) => (
                <td
                  key={column.header}
                  className={cn('px-4 py-3 align-middle text-espresso-900', column.className)}
                >
                  {column.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
