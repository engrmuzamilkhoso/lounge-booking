import type { Metadata } from 'next';
import { AdminShell } from '@/components/admin/admin-shell';
import { AccessDenied } from '@/components/admin/access-denied';
import { getAdminAccess, isStaff } from '@/lib/admin/access';
import { visibleNavigation } from '@/lib/admin/navigation';
import { displayName } from '@/lib/auth/current-user';

export const metadata: Metadata = {
  title: { default: 'Admin', template: '%s | Majestic Admin' },
  robots: { index: false, follow: false },
};

/** Every /admin page: signed-in staff only, with the sidebar limited to their permissions. */
export default async function AdminLayout({ children }: LayoutProps<'/admin'>) {
  const { user, permissions } = await getAdminAccess('/admin');
  if (!isStaff(user)) {
    return <AccessDenied fullPage />;
  }

  return (
    <AdminShell
      navigation={visibleNavigation(permissions)}
      user={{ name: displayName(user), email: user.email, avatarUrl: user.avatarUrl }}
    >
      {children}
    </AdminShell>
  );
}
