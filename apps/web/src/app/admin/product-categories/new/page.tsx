import type { Metadata } from 'next';
import { AccessDenied } from '@/components/admin/access-denied';
import { PageHeader } from '@/components/admin/page-header';
import { getAdminAccess } from '@/lib/admin/access';
import { ProductCategoryForm } from '../product-category-form';

export const metadata: Metadata = { title: 'Add product category' };

export default async function NewProductCategoryPage() {
  const { permissions } = await getAdminAccess('/admin/product-categories');
  if (!permissions.has('product_category_create')) {
    return <AccessDenied />;
  }
  return (
    <>
      <PageHeader
        title="Add product category"
        back={{ href: '/admin/product-categories', label: 'Product categories' }}
      />
      <ProductCategoryForm id={null} initialValues={{ name: '', description: '' }} />
    </>
  );
}
