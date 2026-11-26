import { Plus } from 'lucide-react';
import type { Metadata } from 'next';
import { AccessDenied } from '@/components/admin/access-denied';
import { DataTable } from '@/components/admin/data-table';
import { FilterBar } from '@/components/admin/filter-bar';
import { Notice } from '@/components/admin/notice';
import { PageHeader } from '@/components/admin/page-header';
import { RowActions } from '@/components/admin/row-actions';
import { ButtonLink } from '@/components/ui/button';
import { Select } from '@/components/ui/input';
import { getAdminAccess, resourcePermissions } from '@/lib/admin/access';
import { matchesSearch, searchParam } from '@/lib/admin/queries';
import type { AdminProduct, AdminProductCategory, AdminService } from '@/lib/admin/types';
import { apiRequest, toQueryString } from '@/lib/api/server-api';
import { formatRupees } from '@/lib/format';

export const metadata: Metadata = { title: 'Products' };

export default async function AdminProductsPage({ searchParams }: PageProps<'/admin/products'>) {
  const { permissions } = await getAdminAccess('/admin/products');
  const can = resourcePermissions(permissions, 'product');
  if (!can.canList) {
    return <AccessDenied />;
  }

  const params = await searchParams;
  const search = searchParam(params.search);
  const serviceId = idFilter(params.serviceId);
  const categoryId = idFilter(params.categoryId);

  const [products, services, categories] = await Promise.all([
    apiRequest<AdminProduct[]>(`/admin/products${toQueryString({ serviceId, categoryId })}`),
    apiRequest<AdminService[]>('/admin/services'),
    apiRequest<AdminProductCategory[]>('/admin/product-categories'),
  ]);
  const rows = products.filter((product) =>
    matchesSearch(search, product.name, product.description),
  );

  return (
    <>
      <PageHeader
        title="Products"
        description="What customers book, with prices and free child/infant allowances."
        actions={
          can.canCreate ? (
            <ButtonLink href="/admin/products/new" icon={<Plus aria-hidden className="size-4" />}>
              Add product
            </ButtonLink>
          ) : undefined
        }
      />
      <Notice notice={params.notice} />
      <FilterBar search={search} searchPlaceholder="Product name">
        <div>
          <label htmlFor="filter-service" className="mb-1 block text-xs text-stone-500">
            Service
          </label>
          <Select id="filter-service" name="serviceId" defaultValue={serviceId ?? ''}>
            <option value="">All services</option>
            {services.map((service) => (
              <option key={service.id} value={service.id}>
                {service.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label htmlFor="filter-category" className="mb-1 block text-xs text-stone-500">
            Category
          </label>
          <Select id="filter-category" name="categoryId" defaultValue={categoryId ?? ''}>
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>
        </div>
      </FilterBar>

      <DataTable
        rows={rows}
        rowKey={(product) => product.id}
        emptyMessage="No products match these filters."
        columns={[
          {
            header: 'Product',
            cell: (product) => (
              <span>
                <span className="font-medium">{product.name ?? '—'}</span>
                <span className="block text-xs text-stone-500">
                  {product.service.name} · {product.category.name}
                </span>
              </span>
            ),
          },
          {
            header: 'Adult',
            className: 'text-right whitespace-nowrap',
            cell: (product) => formatRupees(product.price ?? 0),
          },
          {
            header: 'Child',
            className: 'hidden md:table-cell text-right whitespace-nowrap',
            cell: (product) => `${formatRupees(product.childPrice)} (${product.childLimit} free)`,
          },
          {
            header: 'Infant',
            className: 'hidden md:table-cell text-right whitespace-nowrap',
            cell: (product) => `${formatRupees(product.infantPrice)} (${product.infantLimit} free)`,
          },
          {
            header: 'Guest',
            className: 'hidden lg:table-cell text-right whitespace-nowrap',
            cell: (product) =>
              product.guestPrice === null ? '—' : formatRupees(product.guestPrice),
          },
          {
            header: 'Actions',
            className: 'w-32 text-right',
            cell: (product) => (
              <RowActions
                resource="products"
                id={product.id}
                label={`product ${product.name ?? product.id}`}
                editHref={can.canEdit ? `/admin/products/${product.id}/edit` : undefined}
                canDelete={can.canDelete}
              />
            ),
          },
        ]}
      />
    </>
  );
}

function idFilter(value: string | string[] | undefined): string | undefined {
  const id = searchParam(value);
  return id !== undefined && /^\d+$/.test(id) ? id : undefined;
}
