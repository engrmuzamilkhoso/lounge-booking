import { ProductCategoryId, ServiceId } from '@booking/shared-types';
import { PackageOpen } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ProductPicker } from '@/components/bookings/product-picker';
import { PageHero } from '@/components/layout/page-hero';
import { Alert } from '@/components/ui/alert';
import { ButtonLink } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { EmptyState } from '@/components/ui/empty-state';
import { getProducts } from '@/lib/api/queries';
import type { Product } from '@/lib/api/types';
import { requireUser } from '@/lib/auth/current-user';
import { cn } from '@/lib/cn';
import { findServiceBySlug } from '@/lib/content/services';
import { MembershipGate } from './membership-gate';

/** Meet & Assist is offered for both flight types; the other services use one product range. */
const flightTypeTabs = [
  { categoryId: ProductCategoryId.International, label: 'International flight' },
  { categoryId: ProductCategoryId.Domestic, label: 'Domestic flight' },
] as const;

export async function generateMetadata({
  params,
}: PageProps<'/services/[slug]'>): Promise<Metadata> {
  const { slug } = await params;
  const service = findServiceBySlug(slug);
  return { title: service?.name ?? 'Service' };
}

export default async function ServicePage({ params, searchParams }: PageProps<'/services/[slug]'>) {
  const { slug } = await params;
  const service = findServiceBySlug(slug);
  if (service === undefined) {
    notFound();
  }
  await requireUser(`/services/${slug}`);

  const { category } = await searchParams;
  const isMeetAndAssist = service.id === ServiceId.MeetAndAssist;
  const selectedCategoryId = isMeetAndAssist
    ? selectedFlightType(category)
    : ProductCategoryId.InternationalDomestic;
  const products = await getProducts(service.id, selectedCategoryId);

  return (
    <>
      <PageHero eyebrow="Book a service" title={service.name} description={service.summary}>
        <nav aria-label="Breadcrumb" className="mt-4 text-sm text-stone-500">
          <Link href="/services" className="hover:text-espresso-900">
            Services
          </Link>
          <span aria-hidden> / </span>
          <span className="text-espresso-900">{service.name}</span>
        </nav>
      </PageHero>

      <Container className="py-10 sm:py-14">
        {service.accessNote !== undefined && (
          <Alert tone="info" className="mb-8">
            {service.accessNote}
          </Alert>
        )}

        {isMeetAndAssist && (
          <div
            role="tablist"
            aria-label="Flight type"
            className="mb-8 inline-flex rounded-xl border border-stone-200 bg-white p-1"
          >
            {flightTypeTabs.map((tab) => {
              const isSelected = tab.categoryId === selectedCategoryId;
              return (
                <Link
                  key={tab.categoryId}
                  role="tab"
                  aria-selected={isSelected}
                  href={`/services/${slug}?category=${tab.categoryId}`}
                  scroll={false}
                  className={cn(
                    'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                    isSelected
                      ? 'bg-espresso-900 text-white'
                      : 'text-stone-600 hover:text-espresso-900',
                  )}
                >
                  {tab.label}
                </Link>
              );
            })}
          </div>
        )}

        {service.id === ServiceId.Membership ? (
          <MembershipGate products={products} />
        ) : (
          <ProductGrid products={products} />
        )}
      </Container>
    </>
  );
}

function ProductGrid({ products }: { products: Product[] }) {
  if (products.length === 0) {
    return (
      <EmptyState
        icon={PackageOpen}
        title="Nothing available right now"
        description="This service has no bookable options at the moment. Please contact us and we will help you."
        action={<ButtonLink href="/contact">Contact us</ButtonLink>}
      />
    );
  }
  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {products.map((product) => (
        <ProductPicker key={product.id} product={product} />
      ))}
    </div>
  );
}

function selectedFlightType(category: string | string[] | undefined): ProductCategoryId {
  if (category === String(ProductCategoryId.Domestic)) {
    return ProductCategoryId.Domestic;
  }
  return ProductCategoryId.International;
}
