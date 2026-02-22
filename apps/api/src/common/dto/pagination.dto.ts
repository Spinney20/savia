import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '@ssm/shared';
import type { PaginationMeta } from '@ssm/shared';

export interface PaginationQuery {
  page: number;
  limit: number;
  search?: string;
}

/**
 * Parse raw query params into a safe PaginationQuery.
 */
export function parsePaginationQuery(query: Record<string, unknown>): PaginationQuery {
  let page = Number(query.page) || 1;
  if (page < 1) page = 1;

  let limit = Number(query.limit) || DEFAULT_PAGE_SIZE;
  if (limit < 1) limit = 1;
  if (limit > MAX_PAGE_SIZE) limit = MAX_PAGE_SIZE;

  const search = typeof query.search === 'string' ? query.search.trim() : undefined;

  return { page, limit, search: search || undefined };
}

/**
 * Build pagination meta from total count and current query.
 */
export function buildPaginationMeta(total: number, query: PaginationQuery): PaginationMeta {
  return {
    page: query.page,
    limit: query.limit,
    total,
    totalPages: Math.ceil(total / query.limit) || 1,
  };
}
