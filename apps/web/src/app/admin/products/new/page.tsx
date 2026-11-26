import type { Metadata } from 'next';
import { AccessDenied } from '@/components/admin/access-denied';
import { PageHeader } from '@/components/admin/page-header';
import { getAdminAccess } from '@/lib/admin/access';
import { ProductForm } from '../product-form';
import { productFormOptions } from '../product-form-options';

export const metadata: Metadata = { title: 'Add product' };

export default async function NewProductPage() {
  const { permissions } = await getAdminAccess('/admin/products');
  if (!permissions.has('product_create')) {
    return <AccessDenied />;
  }
  const options = await productFormOptions();
  return (
    <>
      <PageHeader title="Add product" back={{ href: '/admin/products', label: 'Products' }} />
      <ProductForm
        id={null}
        initialValues={{
          name: '',
          description: '',
          adultLimit: 0,
          childPrice: 0,
          childLimit: 0,
          infantPrice: 0,
          infantLimit: 0,
        }}
        services={options.services}
        categories={options.categories}
      />
    </>
  );
}
