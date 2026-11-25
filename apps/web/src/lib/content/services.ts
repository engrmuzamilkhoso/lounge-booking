import { ServiceId } from '@booking/shared-types';
import { Armchair, Crown, Footprints, type LucideIcon, Sparkles } from 'lucide-react';

export type ServiceSlug = 'meet-assist' | 'lounge' | 'premier' | 'membership';

export interface ServiceContent {
  id: ServiceId;
  slug: ServiceSlug;
  name: string;
  summary: string;
  icon: LucideIcon;
  /** How access to the service is granted, shown on the booking page. */
  accessNote?: string;
}

/**
 * The four bookable services. Ids match the `lounge_services` table; texts come from the
 * existing website.
 */
export const services: ServiceContent[] = [
  {
    id: ServiceId.MeetAndAssist,
    slug: 'meet-assist',
    name: 'Meet & Assist',
    summary:
      'Check in without having made reservations — our team meets you and guides you through the airport.',
    icon: Footprints,
  },
  {
    id: ServiceId.Lounge,
    slug: 'lounge',
    name: 'Lounge Service',
    summary:
      'Relax in comfort with exclusive lounge access using one of our Alliance Partner premium bank cards.',
    icon: Armchair,
    accessNote:
      'Lounge access is granted with an eligible Alliance Partner bank card, selected when you book.',
  },
  {
    id: ServiceId.PremierServices,
    slug: 'premier',
    name: 'Premier Services',
    summary: 'Our premium airport experience, with the option to bring guests along.',
    icon: Sparkles,
  },
  {
    id: ServiceId.Membership,
    slug: 'membership',
    name: 'Membership',
    summary: 'Members book their visits with their Majestic membership number.',
    icon: Crown,
    accessNote: 'Enter your membership number to see the services included in your plan.',
  },
];

export function findServiceBySlug(slug: string): ServiceContent | undefined {
  return services.find((service) => service.slug === slug);
}

export function findServiceById(id: number): ServiceContent | undefined {
  return services.find((service) => service.id === id);
}
