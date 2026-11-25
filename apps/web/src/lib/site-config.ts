/** Business details shown across the site, taken from the existing Majestic website. */
export const siteConfig = {
  name: 'Majestic Lounge',
  description:
    'Meet & assist, lounge access and premier services for travellers at Jinnah International Airport, Karachi.',
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
  contact: {
    email: 'contact@majestic.com.pk',
    phone: '021-99071249',
    phoneHref: 'tel:+922199071249',
  },
  social: {
    linkedIn: 'https://www.linkedin.com/company/majestic-lounges',
  },
  operator: 'Outdoor One (PVT) Limited',
} as const;
