import type { AdminResource } from './resources';

/** Admin sections whose records are just a name. */
export interface NameLookupConfig {
  key: NameLookupKey;
  resource: AdminResource;
  title: string;
  /** Lower case, for messages: "Delete nationality Pakistani?" */
  singular: string;
  description: string;
  apiPath: string;
  basePath: string;
  /** Laravel permission prefix, e.g. "nationality" → nationality_access, nationality_create… */
  permissionPrefix: string;
  /** Longest name the database column accepts. */
  maxLength: number;
}

export type NameLookupKey = 'nationalities' | 'statuses' | 'sourceRequests' | 'faqCategories';

export const nameLookups: Record<NameLookupKey, NameLookupConfig> = {
  nationalities: {
    key: 'nationalities',
    resource: 'nationalities',
    title: 'Nationalities',
    singular: 'nationality',
    description: 'Choices for the passenger nationality field on booking forms.',
    apiPath: '/admin/nationalities',
    basePath: '/admin/nationalities',
    permissionPrefix: 'nationality',
    maxLength: 225,
  },
  statuses: {
    key: 'statuses',
    resource: 'statuses',
    title: 'Statuses',
    singular: 'status',
    description: 'Status labels kept from the previous system.',
    apiPath: '/admin/statuses',
    basePath: '/admin/statuses',
    permissionPrefix: 'status',
    maxLength: 50,
  },
  sourceRequests: {
    key: 'sourceRequests',
    resource: 'sourceRequests',
    title: 'Booking sources',
    singular: 'booking source',
    description: 'Where bookings come from (website, mobile app).',
    apiPath: '/admin/source-requests',
    basePath: '/admin/source-requests',
    permissionPrefix: 'source_request',
    maxLength: 50,
  },
  faqCategories: {
    key: 'faqCategories',
    resource: 'faqCategories',
    title: 'FAQ categories',
    singular: 'FAQ category',
    description: 'Groups for the questions on the FAQ page.',
    apiPath: '/admin/faq-categories',
    basePath: '/admin/faq-categories',
    permissionPrefix: 'faq_category',
    maxLength: 255,
  },
};

export function isNameLookupKey(value: string): value is NameLookupKey {
  return Object.hasOwn(nameLookups, value);
}
