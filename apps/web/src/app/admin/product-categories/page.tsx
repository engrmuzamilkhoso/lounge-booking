import { Plus } from 'lucide-react';
import type { Metadata } from 'next';
import { AccessDenied } from '@/components/admin/access-denied';
import { DataTable } from '@/components/admin/data-table';
import { Notice } from '@/components/admin/notice';
import { PageHeader } from '@/components/admin/page-header';
import { RowActions } from '@/components/admin/row-actions';
import { ButtonLink } from '@/components/ui/button';
import { getAdminAccess, resourcePermissions } from '@/lib/admin/access';
import type { AdminProductCategory } from '@/lib/admin/types';
import { apiRequest } from '@/lib/api/server-api';

export const metadata: Metadata = { title: 'Product categories' };

export default async function AdminProductCategoriesPage({
  searchParams,
}: PageProps<'/admin/product-categories'>) {
  const { permissions } = await getAdminAccess('/admin/product-categories');
  const can = resourcePermissions(permissions, 'product_category');
  if (!can.canList) {
    return <AccessDenied />;
  }
  const { notice } = await searchParams;
  const categories = await apiRequest<AdminProductCategory[]>('/admin/product-categories');

  return (
    <>
      <PageHeader
        title="Product categories"
        description="Domestic, international and other groupings of products."
        actions={
          can.canCreate ? (
            <ButtonLink
              href="/admin/product-categories/new"
              icon={<Plus aria-hidden className="size-4" />}
            >
              Add category
            </ButtonLink>
          ) : undefined
        }
      />
      <Notice notice={notice} />
      <DataTable
        rows={categories}
        rowKey={(category) => category.id}
        emptyMessage="No categories yet."
        columns={[
          { header: 'ID', cell: (category) => category.id, className: 'w-20 text-stone-500' },
          { header: 'Name', cell: (category) => category.name ?? '—', className: 'font-medium' },
          {
            header: 'Description',
            cell: (category) => category.description ?? '—',
            className: 'hidden md:table-cell text-stone-600',
          },
          {
            header: 'Actions',
            className: 'w-32 text-right',
            cell: (category) => (
              <RowActions
                resource="productCategories"
                id={category.id}
                label={`category ${category.name ?? category.id}`}
                editHref={can.canEdit ? `/admin/product-categories/${category.id}/edit` : undefined}
                canDelete={can.canDelete}
              />
            ),
          },
        ]}
      />
    </>
  );
}
