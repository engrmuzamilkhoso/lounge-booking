import type { MembershipStatus } from '@booking/shared-types';
import type { Booking } from '../api/types';

/** Shapes returned by the admin API endpoints (see Swagger at /api/docs). */

export interface AdminService {
  id: number;
  name: string;
  appDescription: string | null;
  appRoute: string | null;
  appIcon: string | null;
  iconForApp: string | null;
}

export interface AdminProductCategory {
  id: number;
  name: string | null;
  description: string | null;
}

export interface AdminProduct {
  id: number;
  name: string | null;
  description: string | null;
  serviceId: number;
  categoryId: number;
  service: { id: number; name: string };
  category: { id: number; name: string | null };
  price: number | null;
  adultLimit: number;
  childPrice: number;
  childLimit: number;
  infantPrice: number;
  infantLimit: number;
  guestPrice: number | null;
}

export interface AdminCard {
  id: number;
  name: string;
  detail: string;
  bin: string;
  sortOrder: number | null;
  isActive: boolean;
}

export interface AdminMembershipType {
  id: number;
  name: string;
  price1: number;
  price1Text: string;
  price2: number;
  price2Text: string;
}

export interface AdminLookup {
  id: number;
  name: string;
}

export interface AdminFaqCategory {
  id: number;
  name: string | null;
}

export interface AdminFaqQuestion {
  id: number;
  question: string | null;
  answer: string | null;
  category: AdminFaqCategory | null;
}

export interface AdminPermission {
  id: number;
  title: string | null;
}

export interface AdminRole {
  id: number;
  title: string | null;
  permissions: AdminPermission[];
}

export interface AdminUser {
  id: number;
  firstName: string | null;
  lastName: string | null;
  email: string;
  cnic: string | null;
  contact: string | null;
  avatarUrl: string | null;
  roles: { id: number; title: string | null }[];
}

export interface AdminMembership {
  id: number;
  membershipType: { id: number; name: string } | null;
  name: string;
  dob: string;
  contactNo: string;
  email: string;
  address: string | null;
  city: string;
  state: string;
  zipcode: string;
  country: string;
  membershipDeclaration: boolean;
  status: MembershipStatus;
  serialNo: string | null;
  product: { id: number; name: string | null } | null;
  visitLimit: number | null;
  usedVisits: number;
}

export interface AdminAuditLog {
  id: number;
  description: string;
  subjectId: number | null;
  subjectType: string | null;
  userId: number | null;
  properties: unknown;
  host: string | null;
  createdAt: string | null;
}

export interface DashboardSummary {
  totalBookings: number;
  totalSales: number;
  totalUsers: number;
  latestBookings: Omit<Booking, 'attendees'>[];
}
