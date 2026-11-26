import type { Metadata } from 'next';
import { AccessDenied } from '@/components/admin/access-denied';
import { PageHeader } from '@/components/admin/page-header';
import { getAdminAccess } from '@/lib/admin/access';
import { getRecordOrNotFound, idParam } from '@/lib/admin/queries';
import type { AdminProduct } from '@/lib/admin/types';
import { ProductForm } from '../../product-form';
import { productFormOptions } from '../../product-form-options';

export const metadata: Metadata = { title: 'Edit product' };

export default async function EditProductPage({ params }: PageProps<'/admin/products/[id]/edit'>) {
  const { permissions } = await getAdminAccess('/admin/products');
  if (!permissions.has('product_edit')) {
    return <AccessDenied />;
  }
  const { id } = await params;
  const [product, options] = await Promise.all([
    getRecordOrNotFound<AdminProduct>(`/admin/products/${idParam(id)}`),
    productFormOptions(),
  ]);
  return (
    <>
      <PageHeader
        title={`Edit ${product.name ?? 'product'}`}
        back={{ href: '/admin/products', label: 'Products' }}
      />
      <ProductForm
        id={product.id}
        initialValues={{
          name: product.name ?? '',
          description: product.description ?? '',
          serviceId: product.serviceId,
          categoryId: product.categoryId,
          price: product.price ?? 0,
          adultLimit: product.adultLimit,
          childPrice: product.childPrice,
          childLimit: product.childLimit,
          infantPrice: product.infantPrice,
          infantLimit: product.infantLimit,
          guestPrice: product.guestPrice ?? Number.NaN,
        }}
        services={options.services}
        categories={options.categories}
      />
    </>
  );
}
