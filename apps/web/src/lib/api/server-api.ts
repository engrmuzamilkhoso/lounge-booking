import 'server-only';
import type { ApiErrorResponse, ApiSuccessResponse, PaginationMeta } from '@booking/shared-types';
import { ResponseCode } from '@booking/shared-types';
import { readAccessToken } from '../auth/session-cookies';
import { ApiError, friendlyMessage } from './api-error';

/** Base URL of the NestJS API as seen from the Next.js server (never exposed to the browser). */
function apiBaseUrl(): string {
  const url = process.env.API_URL;
  if (url === undefined || url === '') {
    throw new Error('API_URL is not configured (see apps/web/.env.example)');
  }
  return url;
}

export interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  /** Send the signed-in user's access token (default true). */
  authenticated?: boolean;
  headers?: Record<string, string>;
}

export interface ApiPage<TItem> {
  items: TItem[];
  meta: PaginationMeta;
}

async function send<TData>(
  path: string,
  options: ApiRequestOptions,
): Promise<ApiSuccessResponse<TData>> {
  const headers: Record<string, string> = { Accept: 'application/json', ...options.headers };
  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  if (options.authenticated !== false) {
    const accessToken = await readAccessToken();
    if (accessToken !== undefined) {
      headers.Authorization = `Bearer ${accessToken}`;
    }
  }

  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl()}${path}`, {
      method: options.method ?? 'GET',
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      cache: 'no-store',
    });
  } catch {
    throw ApiError.network();
  }

  const payload = (await response.json().catch(() => null)) as
    ApiSuccessResponse<TData> | ApiErrorResponse | null;

  if (!response.ok || payload === null) {
    const errorPayload = payload as ApiErrorResponse | null;
    const code = errorPayload?.status ?? ResponseCode.ServerError;
    throw new ApiError(response.status, code, friendlyMessage(code), errorPayload?.errors);
  }
  return payload as ApiSuccessResponse<TData>;
}

/** Calls the API and returns `data`. Throws ApiError on failure. */
export async function apiRequest<TData>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<TData> {
  const payload = await send<TData>(path, options);
  return payload.data;
}

/** Calls a paginated list endpoint and returns the items with paging details. */
export async function apiRequestPage<TItem>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<ApiPage<TItem>> {
  const payload = await send<TItem[]>(path, options);
  const meta = payload.meta ?? {
    page: 1,
    pageSize: payload.data.length,
    total: payload.data.length,
  };
  return { items: payload.data, meta };
}

/** Builds a query string from defined, non-empty values. */
export function toQueryString(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') {
      search.set(key, String(value));
    }
  }
  const query = search.toString();
  return query === '' ? '' : `?${query}`;
}
