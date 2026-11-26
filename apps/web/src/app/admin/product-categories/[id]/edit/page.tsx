import type { Metadata } from 'next';
import { AccessDenied } from '@/components/admin/access-denied';
import { PageHeader } from '@/components/admin/page-header';
import { getAdminAccess } from '@/lib/admin/access';
import { getRecordOrNotFound, idParam } from '@/lib/admin/queries';
import type { AdminProductCategory } from '@/lib/admin/types';
import { ProductCategoryForm } from '../../product-category-form';

export const metadata: Metadata = { title: 'Edit product category' };

export default async function EditProductCategoryPage({
  params,
}: PageProps<'/admin/product-categories/[id]/edit'>) {
  const { permissions } = await getAdminAccess('/admin/product-categories');
  if (!permissions.has('product_category_edit')) {
    return <AccessDenied />;
  }
  const { id } = await params;
  const category = await getRecordOrNotFound<AdminProductCategory>(
    `/admin/product-categories/${idParam(id)}`,
  );
  return (
    <>
      <PageHeader
        title={`Edit ${category.name ?? 'category'}`}
        back={{ href: '/admin/product-categories', label: 'Product categories' }}
      />
      <ProductCategoryForm
        id={category.id}
        initialValues={{ name: category.name ?? '', description: category.description ?? '' }}
      />
    </>
  );
}
