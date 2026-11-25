import 'server-only';
import { notFound } from 'next/navigation';
import { ApiError } from './api-error';
import { type ApiPage, apiRequest, apiRequestPage, toQueryString } from './server-api';
import type { BankCard, Booking, Lookup, MembershipType, Product, ProductCategory } from './types';

/** Read-only API calls used by Server Components. Each returns typed data or throws ApiError. */

export function getProducts(serviceId: number, categoryId?: number): Promise<Product[]> {
  return apiRequest<Product[]>(`/products${toQueryString({ serviceId, categoryId })}`);
}

export async function getProductOrNotFound(productId: number): Promise<Product> {
  try {
    return await apiRequest<Product>(`/products/${productId}`);
  } catch (error) {
    if (error instanceof ApiError && error.isNotFound) {
      notFound();
    }
    throw error;
  }
}

export function getProductCategories(): Promise<ProductCategory[]> {
  return apiRequest<ProductCategory[]>('/product-categories');
}

export function getBankCards(): Promise<BankCard[]> {
  return apiRequest<BankCard[]>('/cards');
}

export function getNationalities(): Promise<Lookup[]> {
  return apiRequest<Lookup[]>('/nationalities');
}

export function getMembershipTypes(): Promise<MembershipType[]> {
  return apiRequest<MembershipType[]>('/membership-types', { authenticated: false });
}

export function getMyBookings(page: number): Promise<ApiPage<Booking>> {
  return apiRequestPage<Booking>(`/me/bookings${toQueryString({ page, pageSize: 10 })}`);
}

/** The signed-in customer's own booking; any other id is "not found". */
export async function getMyBookingOrNotFound(bookingId: number): Promise<Booking> {
  try {
    return await apiRequest<Booking>(`/me/bookings/${bookingId}`);
  } catch (error) {
    if (error instanceof ApiError && error.isNotFound) {
      notFound();
    }
    throw error;
  }
}
