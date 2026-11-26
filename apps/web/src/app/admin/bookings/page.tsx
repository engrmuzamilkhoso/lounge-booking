import type { Metadata } from 'next';
import Link from 'next/link';
import { AccessDenied } from '@/components/admin/access-denied';
import { DataTable } from '@/components/admin/data-table';
import { FilterBar } from '@/components/admin/filter-bar';
import { Notice } from '@/components/admin/notice';
import { PageHeader } from '@/components/admin/page-header';
import { Pagination } from '@/components/admin/pagination';
import { RowActions } from '@/components/admin/row-actions';
import { PaymentStatusBadge } from '@/components/bookings/payment-status-badge';
import { Input, Select } from '@/components/ui/input';
import { getAdminAccess, resourcePermissions } from '@/lib/admin/access';
import { pageParam, searchParam } from '@/lib/admin/queries';
import type { AdminService } from '@/lib/admin/types';
import { apiRequest, apiRequestPage, toQueryString } from '@/lib/api/server-api';
import type { Booking } from '@/lib/api/types';
import { displayName } from '@/lib/auth/current-user';
import { formatDate, formatRupees, formatTime } from '@/lib/format';

export const metadata: Metadata = { title: 'Bookings' };

const PAGE_SIZE = 20;
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

export default async function AdminBookingsPage({ searchParams }: PageProps<'/admin/bookings'>) {
  const { permissions } = await getAdminAccess('/admin/bookings');
  const can = resourcePermissions(permissions, 'booking');
  if (!can.canList) {
    return <AccessDenied />;
  }

  const params = await searchParams;
  const search = searchParam(params.search);
  const serviceId = searchParam(params.serviceId);
  const departureFrom = dateParam(params.departureFrom);
  const departureTo = dateParam(params.departureTo);
  const page = pageParam(params.page);

  const [bookings, services] = await Promise.all([
    apiRequestPage<Booking>(
      `/admin/bookings${toQueryString({
        page,
        pageSize: PAGE_SIZE,
        search,
        serviceId: serviceId !== undefined && /^\d+$/.test(serviceId) ? serviceId : undefined,
        departureFrom,
        departureTo,
      })}`,
    ),
    apiRequest<AdminService[]>('/services'),
  ]);

  return (
    <>
      <PageHeader
        title="Bookings"
        description="All bookings from the website, the app and staff."
      />
      <Notice notice={params.notice} />
      <FilterBar search={search} searchPlaceholder="Booking reference, flight, customer">
        <div>
          <label htmlFor="filter-service" className="mb-1 block text-xs text-stone-500">
            Service
          </label>
          <Select id="filter-service" name="serviceId" defaultValue={serviceId ?? ''}>
            <option value="">All services</option>
            {services.map((service) => (
              <option key={service.id} value={service.id}>
                {service.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label htmlFor="filter-from" className="mb-1 block text-xs text-stone-500">
            Departing from
          </label>
          <Input id="filter-from" type="date" name="departureFrom" defaultValue={departureFrom} />
        </div>
        <div>
          <label htmlFor="filter-to" className="mb-1 block text-xs text-stone-500">
            to
          </label>
          <Input id="filter-to" type="date" name="departureTo" defaultValue={departureTo} />
        </div>
      </FilterBar>

      <DataTable
        rows={bookings.items}
        rowKey={(booking) => booking.id}
        emptyMessage="No bookings match these filters."
        columns={[
          {
            header: 'Booking',
            cell: (booking) =>
              can.canShow ? (
                <Link
                  href={`/admin/bookings/${booking.id}`}
                  className="font-medium text-gold-600 hover:underline"
                >
                  {booking.code}
                </Link>
              ) : (
                <span className="font-medium">{booking.code}</span>
              ),
          },
          {
            header: 'Customer',
            className: 'hidden md:table-cell',
            cell: (booking) =>
              booking.customer === null ? (
                '—'
              ) : (
                <span>
                  {displayName(booking.customer)}
                  <span className="block text-xs text-stone-500">{booking.customer.email}</span>
                </span>
              ),
          },
          {
            header: 'Service',
            className: 'hidden lg:table-cell',
            cell: (booking) => (
              <span>
                {booking.service.name}
                <span className="block text-xs text-stone-500">{booking.product?.name}</span>
              </span>
            ),
          },
          {
            header: 'Flight',
            cell: (booking) => (
              <span className="whitespace-nowrap">
                {booking.flightNumber}
                <span className="block text-xs text-stone-500">
                  {formatDate(booking.departureDate)}, {formatTime(booking.departureTime)}
                </span>
              </span>
            ),
          },
          {
            header: 'Total',
            className: 'text-right whitespace-nowrap',
            cell: (booking) => formatRupees(booking.totalAmount ?? 0),
          },
          {
            header: 'Payment',
            cell: (booking) => <PaymentStatusBadge status={booking.paymentStatus} />,
          },
          {
            header: 'Actions',
            className: 'w-32 text-right',
            cell: (booking) => (
              <RowActions
                resource="bookings"
                id={booking.id}
                label={`booking ${booking.code}`}
                viewHref={can.canShow ? `/admin/bookings/${booking.id}` : undefined}
                editHref={can.canEdit ? `/admin/bookings/${booking.id}/edit` : undefined}
                canDelete={can.canDelete}
              />
            ),
          },
        ]}
      />
      <Pagination
        meta={bookings.meta}
        basePath="/admin/bookings"
        params={{ search, serviceId, departureFrom, departureTo }}
      />
    </>
  );
}

function dateParam(value: string | string[] | undefined): string | undefined {
  const date = searchParam(value);
  return date !== undefined && DATE_ONLY.test(date) ? date : undefined;
}
