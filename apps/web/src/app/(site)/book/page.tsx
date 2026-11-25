import { ServiceId } from '@booking/shared-types';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Container } from '@/components/ui/container';
import { getBankCards, getNationalities, getProductOrNotFound } from '@/lib/api/queries';
import { requireUser } from '@/lib/auth/current-user';
import { MAX_PASSENGERS_PER_TYPE } from '@/lib/content/product-prices';
import { findServiceById } from '@/lib/content/services';
import { BookingForm } from './booking-form';

export const metadata: Metadata = {
  title: 'Passenger details',
  robots: { index: false },
};

/** /book?product=9&adults=2&children=0&infants=0&guests=0[&membership=5] */
export default async function BookPage({ searchParams }: PageProps<'/book'>) {
  const params = await searchParams;
  const productId = toOptionalId(params.product) ?? 0;
  const currentPath = `/book?${new URLSearchParams(params as Record<string, string>).toString()}`;
  await requireUser(currentPath);

  if (productId < 1) {
    redirect('/services');
  }
  const product = await getProductOrNotFound(productId);
  const service = findServiceById(product.serviceId);
  if (service === undefined) {
    redirect('/services');
  }

  const isLounge = product.serviceId === ServiceId.Lounge;
  const [bankCards, nationalities] = await Promise.all([
    isLounge ? getBankCards() : Promise.resolve([]),
    getNationalities(),
  ]);

  return (
    <Container className="py-10 sm:py-14">
      <h1 className="text-2xl font-semibold sm:text-3xl">Passenger details</h1>
      <p className="mt-2 text-stone-600">
        {service.name} · {product.name}
      </p>
      <div className="mt-8">
        <BookingForm
          product={product}
          serviceName={service.name}
          counts={{
            adults: Math.max(1, toCount(params.adults, 1)),
            children: toCount(params.children, 0),
            infants: toCount(params.infants, 0),
            guests: product.guestPrice === null ? 0 : toCount(params.guests, 0),
          }}
          membershipId={toOptionalId(params.membership)}
          bankCards={bankCards}
          nationalities={nationalities.map((nationality) => nationality.name)}
        />
      </div>
    </Container>
  );
}

function toCount(value: string | string[] | undefined, fallback: number): number {
  const parsed = Number(typeof value === 'string' ? value : NaN);
  if (!Number.isInteger(parsed) || parsed < 0) {
    return fallback;
  }
  return Math.min(parsed, MAX_PASSENGERS_PER_TYPE);
}

/** Record ids are positive integers with no upper bound (unlike passenger counts). */
function toOptionalId(value: string | string[] | undefined): number | undefined {
  const parsed = Number(typeof value === 'string' ? value : NaN);
  if (!Number.isInteger(parsed) || parsed < 1) {
    return undefined;
  }
  return parsed;
}
