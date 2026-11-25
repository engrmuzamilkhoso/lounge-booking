import { Mail, Phone } from 'lucide-react';
import { LinkedInIcon } from '@/components/icons/linkedin-icon';
import Link from 'next/link';
import { Container } from '@/components/ui/container';
import { siteConfig } from '@/lib/site-config';
import { Logo } from './logo';
import { legalNavigation, primaryNavigation } from './navigation';

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto bg-espresso-900 text-stone-300">
      <Container className="grid gap-10 py-14 md:grid-cols-[1.5fr_1fr_1fr]">
        <div className="max-w-sm">
          <Logo inverted />
          <p className="mt-4 text-sm leading-relaxed text-stone-400">
            Airport hospitality at Jinnah International Airport, Karachi — meet &amp; assist, lounge
            access and premier services for every class of traveller.
          </p>
        </div>

        <nav aria-label="Footer">
          <h2 className="text-sm font-semibold tracking-wide text-gold-200 uppercase">Explore</h2>
          <ul className="mt-4 flex flex-col gap-2.5 text-sm">
            {primaryNavigation.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="hover:text-white">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h2 className="text-sm font-semibold tracking-wide text-gold-200 uppercase">Contact</h2>
          <ul className="mt-4 flex flex-col gap-3 text-sm">
            <li>
              <a
                href={`mailto:${siteConfig.contact.email}`}
                className="inline-flex items-center gap-2 hover:text-white"
              >
                <Mail aria-hidden className="size-4 text-gold-300" />
                {siteConfig.contact.email}
              </a>
            </li>
            <li>
              <a
                href={siteConfig.contact.phoneHref}
                className="inline-flex items-center gap-2 hover:text-white"
              >
                <Phone aria-hidden className="size-4 text-gold-300" />
                {siteConfig.contact.phone}
              </a>
            </li>
            <li>
              <a
                href={siteConfig.social.linkedIn}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 hover:text-white"
              >
                <LinkedInIcon className="size-4 text-gold-300" />
                LinkedIn
              </a>
            </li>
          </ul>
        </div>
      </Container>

      <div className="border-t border-white/10">
        <Container className="flex flex-col gap-3 py-6 text-xs text-stone-400 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {siteConfig.name}. Operated by {siteConfig.operator}.
          </p>
          <ul className="flex gap-5">
            {legalNavigation.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="hover:text-white">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      </div>
    </footer>
  );
}
