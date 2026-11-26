import { MembershipStatus, ServiceId } from '@booking/shared-types';
import { Pencil } from 'lucide-react';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { AccessDenied } from '@/components/admin/access-denied';
import { DeleteButton } from '@/components/admin/delete-button';
import { MembershipStatusBadge } from '@/components/admin/membership-status-badge';
import { Notice } from '@/components/admin/notice';
import { PageHeader } from '@/components/admin/page-header';
import { ButtonLink } from '@/components/ui/button';
import { getAdminAccess, resourcePermissions } from '@/lib/admin/access';
import { getRecordOrNotFound, idParam } from '@/lib/admin/queries';
import type { AdminMembership, AdminProduct } from '@/lib/admin/types';
import { apiRequest } from '@/lib/api/server-api';
import { formatDate } from '@/lib/format';
import { ApproveMembershipForm } from './approve-membership-form';

export const metadata: Metadata = { title: 'Membership' };

export default async function AdminMembershipPage({
  params,
  searchParams,
}: PageProps<'/admin/memberships/[id]'>) {
  const { permissions } = await getAdminAccess('/admin/memberships');
  const can = resourcePermissions(permissions, 'membership');
  if (!can.canShow) {
    return <AccessDenied />;
  }
  const { id } = await params;
  const { notice } = await searchParams;
  const membership = await getRecordOrNotFound<AdminMembership>(
    `/admin/memberships/${idParam(id)}`,
  );

  const canApprove =
    membership.status === MembershipStatus.Pending && permissions.has('approve_membership');
  let approval: { serialNo: string; products: AdminProduct[] } | null = null;
  if (canApprove) {
    const [next, products] = await Promise.all([
      apiRequest<{ serialNo: string }>('/admin/memberships/next-serial-no'),
      apiRequest<AdminProduct[]>(`/products?serviceId=${ServiceId.Membership}`),
    ]);
    approval = { serialNo: next.serialNo, products };
  }

  return (
    <>
      <PageHeader
        title={membership.name}
        description={membership.membershipType?.name ?? undefined}
        back={{ href: '/admin/memberships', label: 'Memberships' }}
        actions={
          <>
            {can.canEdit && (
              <ButtonLink
                href={`/admin/memberships/${membership.id}/edit`}
                icon={<Pencil aria-hidden className="size-4" />}
              >
                Edit
              </ButtonLink>
            )}
            {can.canDelete && (
              <DeleteButton
                resource="memberships"
                id={membership.id}
                label={`membership of ${membership.name}`}
                redirectTo="/admin/memberships?notice=deleted"
              />
            )}
          </>
        }
      />
      <Notice notice={notice} />

      <div className="grid gap-6 xl:grid-cols-3">
        <Section title="Applicant" className="xl:col-span-2">
          <dl className="grid gap-4 text-sm sm:grid-cols-2">
            <Detail label="Name" value={membership.name} />
            <Detail label="Date of birth" value={formatDate(membership.dob)} />
            <Detail label="Email" value={membership.email} />
            <Detail label="Phone" value={membership.contactNo} />
            <Detail label="Address" value={membership.address ?? '—'} />
            <Detail
              label="City / state"
              value={`${membership.city}, ${membership.state} ${membership.zipcode}`}
            />
            <Detail label="Country" value={membership.country} />
            <Detail
              label="Declaration accepted"
              value={membership.membershipDeclaration ? 'Yes' : 'No'}
            />
          </dl>
        </Section>

        <Section title="Membership">
          <div className="mb-4">
            <MembershipStatusBadge status={membership.status} />
          </div>
          <dl className="grid gap-4 text-sm">
            <Detail label="Type" value={membership.membershipType?.name ?? '—'} />
            <Detail label="Serial number" value={membership.serialNo ?? 'Not issued yet'} />
            <Detail label="Product" value={membership.product?.name ?? '—'} />
            <Detail
              label="Visits used"
              value={
                membership.visitLimit === null
                  ? '—'
                  : `${membership.usedVisits} of ${membership.visitLimit}`
              }
            />
          </dl>
        </Section>
      </div>

      {approval !== null && (
        <section className="mt-6 max-w-3xl rounded-card border border-gold-200 bg-gold-50 p-6">
          <h2 className="text-base font-semibold">Approve this application</h2>
          <p className="mt-1 mb-5 text-sm text-stone-600">
            Issues the serial number the member uses when booking. The next free number is filled
            in.
          </p>
          <ApproveMembershipForm
            membershipId={membership.id}
            suggestedSerialNo={approval.serialNo}
            products={approval.products.map((product) => ({
              value: product.id,
              label: product.name ?? `Product ${product.id}`,
            }))}
          />
        </section>
      )}
    </>
  );
}

function Section({
  title,
  className,
  children,
}: {
  title: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      className={`rounded-card border border-stone-200 bg-white p-6 shadow-card ${className ?? ''}`}
    >
      <h2 className="mb-4 text-base font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-stone-500">{label}</dt>
      <dd className="mt-0.5 font-medium break-words text-espresso-900">{value}</dd>
    </div>
  );
}
