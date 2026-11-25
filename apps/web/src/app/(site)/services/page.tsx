import { ArrowRight } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHero } from '@/components/layout/page-hero';
import { Container } from '@/components/ui/container';
import { services } from '@/lib/content/services';

export const metadata: Metadata = {
  title: 'Services',
  description:
    'Meet & assist, lounge access, premier services and membership at Jinnah International Airport, Karachi.',
};

export default function ServicesPage() {
  return (
    <>
      <PageHero
        eyebrow="Majestic services"
        title="Choose your service"
        description="Experience premium comfort and convenience with our exclusive airport services at Jinnah International Airport, Karachi."
      />
      <Container className="py-12 sm:py-16">
        <ul className="grid gap-6 md:grid-cols-2">
          {services.map((service) => (
            <li key={service.slug}>
              <Link
                href={`/services/${service.slug}`}
                className="group flex h-full gap-5 rounded-card border border-stone-200 bg-white p-6 shadow-card transition hover:border-gold-300 hover:shadow-raised sm:p-8"
              >
                <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-espresso-900 text-gold-200">
                  <service.icon aria-hidden className="size-7" />
                </span>
                <span className="flex flex-col">
                  <span className="text-xl font-semibold text-espresso-900">{service.name}</span>
                  <span className="mt-2 text-sm leading-relaxed text-stone-600">
                    {service.summary}
                  </span>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-gold-600">
                    Select service
                    <ArrowRight
                      aria-hidden
                      className="size-4 transition-transform group-hover:translate-x-0.5"
                    />
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </>
  );
}
