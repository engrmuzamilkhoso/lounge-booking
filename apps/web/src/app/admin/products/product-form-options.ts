import 'server-only';
import type { AdminProductCategory, AdminService } from '@/lib/admin/types';
import { apiRequest } from '@/lib/api/server-api';

/** Service and category choices for the product form. */
export async function productFormOptions(): Promise<{
  services: { value: number; label: string }[];
  categories: { value: number; label: string }[];
}> {
  const [services, categories] = await Promise.all([
    apiRequest<AdminService[]>('/admin/services'),
    apiRequest<AdminProductCategory[]>('/admin/product-categories'),
  ]);
  return {
    services: services.map((service) => ({ value: service.id, label: service.name })),
    categories: categories.map((category) => ({
      value: category.id,
      label: category.name ?? `Category ${category.id}`,
    })),
  };
}
