import { Eye, Pencil } from 'lucide-react';
import Link from 'next/link';
import type { AdminResource } from '@/lib/admin/resources';
import { DeleteButton } from './delete-button';

interface RowActionsProps {
  resource: AdminResource;
  id: number;
  label: string;
  viewHref?: string;
  editHref?: string;
  canDelete: boolean;
}

/** View / edit / delete icons at the end of a table row, each only when permitted. */
export function RowActions({
  resource,
  id,
  label,
  viewHref,
  editHref,
  canDelete,
}: RowActionsProps) {
  return (
    <div className="flex items-center justify-end gap-1">
      {viewHref !== undefined && (
        <Link
          href={viewHref}
          aria-label={`View ${label}`}
          title="View"
          className="rounded-lg p-2 text-stone-500 hover:bg-stone-100 hover:text-espresso-900"
        >
          <Eye aria-hidden className="size-4" />
        </Link>
      )}
      {editHref !== undefined && (
        <Link
          href={editHref}
          aria-label={`Edit ${label}`}
          title="Edit"
          className="rounded-lg p-2 text-stone-500 hover:bg-stone-100 hover:text-espresso-900"
        >
          <Pencil aria-hidden className="size-4" />
        </Link>
      )}
      {canDelete && <DeleteButton resource={resource} id={id} label={label} compact />}
    </div>
  );
}
