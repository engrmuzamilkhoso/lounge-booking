import 'server-only';
import { notFound } from 'next/navigation';
import { ApiError } from '../api/api-error';
import { apiRequest } from '../api/server-api';

/** One admin record by API path, or the 404 page when it does not exist. */
export async function getRecordOrNotFound<TRecord>(path: string): Promise<TRecord> {
  try {
    return await apiRequest<TRecord>(path);
  } catch (error) {
    if (error instanceof ApiError && error.isNotFound) {
      notFound();
    }
    throw error;
  }
}

/** Reads a single string search param ("?page=2"); arrays and missing values become undefined. */
export function searchParam(value: string | string[] | undefined): string | undefined {
  return typeof value === 'string' && value !== '' ? value : undefined;
}

/** A positive page number from the URL, defaulting to 1. */
export function pageParam(value: string | string[] | undefined): number {
  const page = Number(searchParam(value));
  return Number.isInteger(page) && page > 0 ? page : 1;
}

/** A positive record id from the URL, or the 404 page. */
export function idParam(value: string): number {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    notFound();
  }
  return id;
}

/** Case-insensitive filter for small, unpaginated lists (lookups, catalogue). */
export function matchesSearch(search: string | undefined, ...fields: (string | null)[]): boolean {
  if (search === undefined) {
    return true;
  }
  const needle = search.toLowerCase();
  return fields.some((field) => field !== null && field.toLowerCase().includes(needle));
}
