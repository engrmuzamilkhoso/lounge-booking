/** Main site navigation, used by the desktop header and the mobile menu. */
export const primaryNavigation = [
  { href: '/services', label: 'Services' },
  { href: '/membership', label: 'Membership' },
  { href: '/about', label: 'About' },
  { href: '/faq', label: 'FAQ' },
  { href: '/contact', label: 'Contact' },
] as const;

export const legalNavigation = [
  { href: '/terms', label: 'Terms & Conditions' },
  { href: '/privacy', label: 'Privacy Policy' },
] as const;
