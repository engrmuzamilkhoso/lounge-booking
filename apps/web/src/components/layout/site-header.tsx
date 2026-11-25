'use client';

import { Menu, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { ButtonLink } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { cn } from '@/lib/cn';
import { AccountMenu } from './account-menu';
import { Logo } from './logo';
import { primaryNavigation } from './navigation';

function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader() {
  const pathname = usePathname();
  // The page the mobile menu was opened on; navigating elsewhere closes it automatically.
  const [menuOpenedOnPath, setMenuOpenedOnPath] = useState<string | null>(null);
  const isMobileMenuOpen = menuOpenedOnPath === pathname;

  const toggleMobileMenu = () => {
    setMenuOpenedOnPath(isMobileMenuOpen ? null : pathname);
  };

  return (
    <header className="sticky top-0 z-30 border-b border-stone-200/80 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/75">
      <Container className="flex h-16 items-center justify-between gap-6">
        <Logo />

        <nav aria-label="Main" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {primaryNavigation.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive(pathname, item.href) ? 'page' : undefined}
                  className={cn(
                    'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive(pathname, item.href)
                      ? 'text-gold-600'
                      : 'text-stone-600 hover:bg-stone-100 hover:text-espresso-900',
                  )}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden lg:block">
            <AccountMenu />
          </div>
          <ButtonLink href="/services" size="sm" className="hidden sm:inline-flex">
            Book a lounge
          </ButtonLink>
          <button
            type="button"
            onClick={toggleMobileMenu}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-menu"
            aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
            className="rounded-lg p-2 text-espresso-900 hover:bg-stone-100 lg:hidden"
          >
            {isMobileMenuOpen ? (
              <X aria-hidden className="size-6" />
            ) : (
              <Menu aria-hidden className="size-6" />
            )}
          </button>
        </div>
      </Container>

      {isMobileMenuOpen && (
        <div id="mobile-menu" className="border-t border-stone-200 bg-white lg:hidden">
          <Container className="flex flex-col gap-1 py-4">
            <nav aria-label="Main">
              <ul className="flex flex-col">
                {primaryNavigation.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={isActive(pathname, item.href) ? 'page' : undefined}
                      className={cn(
                        'block rounded-lg px-3 py-3 text-base font-medium',
                        isActive(pathname, item.href)
                          ? 'bg-gold-50 text-gold-700'
                          : 'text-espresso-900 hover:bg-stone-50',
                      )}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            <div className="mt-3 flex items-center justify-between gap-3 border-t border-stone-100 pt-4">
              <AccountMenu />
              <ButtonLink href="/services" size="sm" className="sm:hidden">
                Book a lounge
              </ButtonLink>
            </div>
          </Container>
        </div>
      )}
    </header>
  );
}
