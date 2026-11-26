/**
 * Admin resources that can be deleted from the panel, with their API endpoint and list page.
 * Server Actions accept only these keys, so a request can never reach any other API path.
 */
export const adminResources = {
  bookings: { apiPath: '/admin/bookings', listPath: '/admin/bookings' },
  memberships: { apiPath: '/admin/memberships', listPath: '/admin/memberships' },
  users: { apiPath: '/admin/users', listPath: '/admin/users' },
  roles: { apiPath: '/admin/roles', listPath: '/admin/roles' },
  permissions: { apiPath: '/admin/permissions', listPath: '/admin/permissions' },
  services: { apiPath: '/admin/services', listPath: '/admin/services' },
  products: { apiPath: '/admin/products', listPath: '/admin/products' },
  productCategories: {
    apiPath: '/admin/product-categories',
    listPath: '/admin/product-categories',
  },
  cards: { apiPath: '/admin/cards', listPath: '/admin/cards' },
  membershipTypes: { apiPath: '/admin/membership-types', listPath: '/admin/membership-types' },
  nationalities: { apiPath: '/admin/nationalities', listPath: '/admin/nationalities' },
  statuses: { apiPath: '/admin/statuses', listPath: '/admin/statuses' },
  sourceRequests: { apiPath: '/admin/source-requests', listPath: '/admin/source-requests' },
  faqCategories: { apiPath: '/admin/faq-categories', listPath: '/admin/faq-categories' },
  faqQuestions: { apiPath: '/admin/faq-questions', listPath: '/admin/faq-questions' },
} as const;

export type AdminResource = keyof typeof adminResources;

export function isAdminResource(value: string): value is AdminResource {
  return Object.hasOwn(adminResources, value);
}
