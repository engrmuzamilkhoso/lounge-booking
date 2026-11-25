import {
  Accessibility,
  ArrowRight,
  Car,
  Coffee,
  CreditCard,
  Globe,
  type LucideIcon,
  Newspaper,
  Phone,
  PlaneTakeoff,
  Presentation,
  Snowflake,
  Tv,
  Wifi,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { ButtonLink } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { services } from '@/lib/content/services';

const facilities: { label: string; icon: LucideIcon }[] = [
  { label: 'Wi-Fi', icon: Wifi },
  { label: 'Disabled access', icon: Accessibility },
  { label: 'Internet', icon: Globe },
  { label: 'Air conditioning', icon: Snowflake },
  { label: 'Flight information', icon: PlaneTakeoff },
  { label: 'Conference', icon: Presentation },
  { label: 'TV', icon: Tv },
  { label: 'Refreshments', icon: Coffee },
  { label: 'Newspapers & magazines', icon: Newspaper },
  { label: 'Telephone', icon: Phone },
  { label: 'Digital payments', icon: CreditCard },
  { label: 'Golf cart', icon: Car },
];

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <IntroSection />
      <ServicesSection />
      <FacilitiesSection />
      <PartnerCardSection />
    </>
  );
}

function HeroSection() {
  return (
    <section className="relative isolate overflow-hidden bg-espresso-900">
      <Image
        src="/images/hero-lounge.webp"
        alt=""
        fill
        priority
        sizes="100vw"
        className="-z-10 object-cover opacity-45"
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-espresso-950/90 via-espresso-900/70 to-espresso-900/30" />
      <Container className="grid gap-10 py-20 sm:py-28 lg:grid-cols-2 lg:items-center lg:py-32">
        <div>
          <p className="text-sm font-semibold tracking-wider text-gold-300 uppercase">
            Jinnah International Airport, Karachi
          </p>
          <h1 className="mt-4 text-4xl leading-tight font-semibold text-white sm:text-5xl">
            Airport hospitality services, done properly.
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-stone-200">
            Meet &amp; assist, lounge access and premier services — a haven of comfort and
            convenience for discerning travellers.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink
              href="/services"
              variant="gold"
              size="lg"
              icon={<ArrowRight aria-hidden className="order-last size-4" />}
            >
              Book a lounge
            </ButtonLink>
            <ButtonLink href="/membership" variant="inverse" size="lg">
              Explore membership
            </ButtonLink>
          </div>
        </div>
        <div className="rounded-2xl border border-white/15 bg-white/10 p-6 text-stone-100 backdrop-blur-sm sm:p-8">
          <p className="leading-relaxed">
            Relax in stylish and spacious seating areas, complete with plush armchairs, ottomans and
            power outlets for charging your devices. Complimentary Wi-Fi keeps you connected while
            you wait for your flight.
          </p>
          <p className="mt-4 leading-relaxed text-gold-100">
            Enjoy free access and a complimentary meal with our Alliance Partners&apos; premium bank
            cards.
          </p>
        </div>
      </Container>
    </section>
  );
}

function IntroSection() {
  return (
    <section className="bg-white">
      <Container className="py-16 text-center sm:py-20">
        <p className="text-sm font-semibold tracking-wider text-gold-600 uppercase">
          Majestic Lounge
        </p>
        <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">We are preferred by the best</h2>
        <p className="mx-auto mt-4 max-w-3xl text-lg leading-relaxed text-stone-600">
          An exclusive airport lounge designed to provide travellers with an oasis of tranquillity
          amidst the hustle and bustle of air travel.
        </p>
      </Container>
    </section>
  );
}

function ServicesSection() {
  return (
    <section aria-labelledby="services-heading">
      <Container className="py-16 sm:py-20">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 id="services-heading" className="text-3xl font-semibold">
              Services we provide
            </h2>
            <p className="mt-2 max-w-2xl text-stone-600">
              Enjoy dining and shopping, and receive real-time updates on check-in and boarding.
            </p>
          </div>
          <Link
            href="/services"
            className="inline-flex items-center gap-1 text-sm font-semibold text-gold-600 hover:text-gold-700"
          >
            View all services
            <ArrowRight aria-hidden className="size-4" />
          </Link>
        </div>

        <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((service) => (
            <li key={service.slug}>
              <Link
                href={`/services/${service.slug}`}
                className="group flex h-full flex-col rounded-card border border-stone-200 bg-white p-6 shadow-card transition hover:-translate-y-0.5 hover:border-gold-300 hover:shadow-raised"
              >
                <span className="flex size-12 items-center justify-center rounded-xl bg-gold-50 text-gold-600 transition-colors group-hover:bg-espresso-900 group-hover:text-gold-200">
                  <service.icon aria-hidden className="size-6" />
                </span>
                <h3 className="mt-5 text-lg font-semibold">{service.name}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-stone-600">
                  {service.summary}
                </p>
                <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-gold-600">
                  Book now
                  <ArrowRight
                    aria-hidden
                    className="size-4 transition-transform group-hover:translate-x-0.5"
                  />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

function FacilitiesSection() {
  return (
    <section aria-labelledby="facilities-heading" className="bg-white">
      <Container className="grid gap-12 py-16 sm:py-20 lg:grid-cols-[1fr_1.4fr] lg:items-center">
        <div>
          <h2 id="facilities-heading" className="text-3xl font-semibold">
            Facilities we provide
          </h2>
          <p className="mt-3 text-stone-600">
            Fly with any airline and in any class, and enjoy the lounge.
          </p>
          <div className="relative mt-8 aspect-[4/3] overflow-hidden rounded-card shadow-raised">
            <Image
              src="/images/reception.png"
              alt="The Majestic Lounge reception desk"
              fill
              sizes="(min-width: 1024px) 40vw, 100vw"
              className="object-cover"
            />
          </div>
        </div>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {facilities.map((facility) => (
            <li
              key={facility.label}
              className="flex items-center gap-3 rounded-xl border border-stone-200 bg-stone-50 px-4 py-4"
            >
              <facility.icon aria-hidden className="size-5 shrink-0 text-gold-600" />
              <span className="text-sm font-medium text-espresso-900">{facility.label}</span>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

function PartnerCardSection() {
  return (
    <section>
      <Container className="py-16 sm:py-20">
        <div className="relative overflow-hidden rounded-3xl bg-espresso-900 px-6 py-12 text-center sm:px-12">
          <div
            aria-hidden
            className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-gold-700 via-gold-200 to-gold-700"
          />
          <h2 className="text-2xl font-semibold text-white sm:text-3xl">
            Have an Alliance Partner bank card?
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-stone-300">
            Enjoy free lounge access and a complimentary meal with eligible premium bank cards.
            Choose your card when you book.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <ButtonLink href="/services/lounge" variant="gold" size="lg">
              Book lounge access
            </ButtonLink>
            <ButtonLink href="/contact" variant="inverse" size="lg">
              Contact us
            </ButtonLink>
          </div>
        </div>
      </Container>
    </section>
  );
}
