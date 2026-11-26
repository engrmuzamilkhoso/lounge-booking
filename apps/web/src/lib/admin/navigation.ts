/**
 * Admin sidebar. Each link is shown only when the user holds its permission (the same keys as
 * Laravel's admin menu).
 */
export type AdminIconName =
  | 'dashboard'
  | 'bookings'
  | 'scan'
  | 'memberships'
  | 'users'
  | 'roles'
  | 'permissions'
  | 'services'
  | 'products'
  | 'categories'
  | 'cards'
  | 'membershipTypes'
  | 'lookups'
  | 'faq'
  | 'audit';

export interface AdminNavLink {
  href: string;
  label: string;
  icon: AdminIconName;
  permission: string;
}

export interface AdminNavGroup {
  label: string;
  links: AdminNavLink[];
}

export const adminNavigation: AdminNavGroup[] = [
  {
    label: 'Overview',
    links: [{ href: '/admin', label: 'Dashboard', icon: 'dashboard', permission: 'dashboard' }],
  },
  {
    label: 'Operations',
    links: [
      {
        href: '/admin/bookings',
        label: 'Bookings',
        icon: 'bookings',
        permission: 'booking_access',
      },
      {
        href: '/staff/check-in',
        label: 'Scan passes',
        icon: 'scan',
        permission: 'booking_show',
      },
      {
        href: '/admin/memberships',
        label: 'Memberships',
        icon: 'memberships',
        permission: 'membership_access',
      },
    ],
  },
  {
    label: 'Catalogue',
    links: [
      {
        href: '/admin/services',
        label: 'Services',
        icon: 'services',
        permission: 'service_access',
      },
      {
        href: '/admin/products',
        label: 'Products',
        icon: 'products',
        permission: 'product_access',
      },
      {
        href: '/admin/product-categories',
        label: 'Product categories',
        icon: 'categories',
        permission: 'product_category_access',
      },
      { href: '/admin/cards', label: 'Bank cards', icon: 'cards', permission: 'card_access' },
      {
        href: '/admin/membership-types',
        label: 'Membership types',
        icon: 'membershipTypes',
        permission: 'membership_type_access',
      },
    ],
  },
  {
    label: 'Content',
    links: [
      {
        href: '/admin/faq-questions',
        label: 'FAQ questions',
        icon: 'faq',
        permission: 'faq_question_access',
      },
      {
        href: '/admin/faq-categories',
        label: 'FAQ categories',
        icon: 'faq',
        permission: 'faq_category_access',
      },
      {
        href: '/admin/nationalities',
        label: 'Nationalities',
        icon: 'lookups',
        permission: 'nationality_access',
      },
      { href: '/admin/statuses', label: 'Statuses', icon: 'lookups', permission: 'status_access' },
      {
        href: '/admin/source-requests',
        label: 'Booking sources',
        icon: 'lookups',
        permission: 'source_request_access',
      },
    ],
  },
  {
    label: 'Access',
    links: [
      { href: '/admin/users', label: 'Users', icon: 'users', permission: 'user_access' },
      { href: '/admin/roles', label: 'Roles', icon: 'roles', permission: 'role_access' },
      {
        href: '/admin/permissions',
        label: 'Permissions',
        icon: 'permissions',
        permission: 'permission_access',
      },
      {
        href: '/admin/audit-logs',
        label: 'Audit log',
        icon: 'audit',
        permission: 'audit_log_access',
      },
    ],
  },
];

/** The sidebar filtered to what this user may open; empty groups are dropped. */
export function visibleNavigation(permissions: ReadonlySet<string>): AdminNavGroup[] {
  return adminNavigation
    .map((group) => ({
      label: group.label,
      links: group.links.filter((link) => permissions.has(link.permission)),
    }))
    .filter((group) => group.links.length > 0);
}
