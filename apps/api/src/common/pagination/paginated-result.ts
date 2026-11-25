import type { PaginationMeta } from '@booking/shared-types';
import type { PaginationQueryDto } from './pagination-query.dto.js';

/**
 * Returned by list endpoints. The response interceptor recognises it and responds with
 * `{ status, message, data: items, meta }` instead of nesting the whole object in `data`.
 */
export class PaginatedResult<TItem> {
  constructor(
    readonly items: TItem[],
    readonly meta: PaginationMeta,
  ) {}

  static of<TItem>(
    items: TItem[],
    total: number,
    query: PaginationQueryDto,
  ): PaginatedResult<TItem> {
    return new PaginatedResult(items, { page: query.page, pageSize: query.pageSize, total });
  }
}
