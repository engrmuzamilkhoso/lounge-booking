import { CalendarCheck, type LucideIcon, ScanLine, UsersRound, Wallet } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { AccessDenied } from '@/components/admin/access-denied';
import { DataTable } from '@/components/admin/data-table';
import { PageHeader } from '@/components/admin/page-header';
import { PaymentStatusBadge } from '@/components/bookings/payment-status-badge';
import { ButtonLink } from '@/components/ui/button';
import { getAdminAccess } from '@/lib/admin/access';
import type { DashboardSummary } from '@/lib/admin/types';
import { apiRequest } from '@/lib/api/server-api';
import { displayName } from '@/lib/auth/current-user';
import { formatDate, formatRupees } from '@/lib/format';

export const metadata: Metadata = { title: 'Dashboard' };

export default async function AdminDashboardPage() {
  const { user, permissions } = await getAdminAccess('/admin');
  if (!permissions.has('dashboard')) {
    return <AccessDenied />;
  }
  const summary = await apiRequest<DashboardSummary>('/admin/dashboard');
  const canOpenBookings = permissions.has('booking_show');

  return (
    <>
      <PageHeader
        title={`Welcome, ${user.firstName ?? displayName(user)}`}
        description="Bookings, sales and customers at a glance."
        actions={
          permissions.has('booking_show') ? (
            <ButtonLink href="/admin/check-in" icon={<ScanLine aria-hidden className="size-4" />}>
              Scan a pass
            </ButtonLink>
          ) : undefined
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={CalendarCheck} label="Bookings" value={String(summary.totalBookings)} />
        <StatCard icon={Wallet} label="Booking value" value={formatRupees(summary.totalSales)} />
        <StatCard icon={UsersRound} label="Users" value={String(summary.totalUsers)} />
      </div>

      <div className="mt-8 mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Latest bookings</h2>
        {permissions.has('booking_access') && (
          <Link
            href="/admin/bookings"
            className="text-sm font-medium text-gold-600 hover:underline"
          >
            All bookings
          </Link>
        )}
      </div>
      <DataTable
        rows={summary.latestBookings}
        rowKey={(booking) => booking.id}
        emptyMessage="No bookings yet."
        columns={[
          {
            header: 'Booking',
            cell: (booking) =>
              canOpenBookings ? (
                <Link
                  href={`/admin/bookings/${booking.id}`}
                  className="font-medium text-gold-600 hover:underline"
                >
                  {booking.code}
                </Link>
              ) : (
                booking.code
              ),
          },
          {
            header: 'Customer',
            cell: (booking) => (booking.customer === null ? '—' : displayName(booking.customer)),
            className: 'hidden md:table-cell',
          },
          {
            header: 'Service',
            cell: (booking) => booking.product?.name ?? booking.service.name,
            className: 'hidden lg:table-cell',
          },
          { header: 'Departure', cell: (booking) => formatDate(booking.departureDate) },
          {
            header: 'Total',
            cell: (booking) => formatRupees(booking.totalAmount ?? 0),
            className: 'text-right',
          },
          {
            header: 'Payment',
            cell: (booking) => <PaymentStatusBadge status={booking.paymentStatus} />,
          },
        ]}
      />
    </>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-card border border-stone-200 bg-white p-5 shadow-card">
      <span className="flex size-11 items-center justify-center rounded-full bg-gold-50 text-gold-600">
        <Icon aria-hidden className="size-5" />
      </span>
      <div>
        <p className="text-sm text-stone-500">{label}</p>
        <p className="text-xl font-semibold text-espresso-900">{value}</p>
      </div>
    </div>
  );
}
