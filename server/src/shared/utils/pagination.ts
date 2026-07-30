export interface PaginationQuery {
  page?: number;
  limit?: number;
}

export interface PaginationOptions {
  page: number;
  limit: number;
  skip: number;
}

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export const resolvePagination = (
  query: PaginationQuery,
): PaginationOptions => {
  const page =
    query.page && query.page > 0 ? Math.floor(query.page) : DEFAULT_PAGE;
  const rawLimit =
    query.limit && query.limit > 0 ? Math.floor(query.limit) : DEFAULT_LIMIT;
  const limit = Math.min(rawLimit, MAX_LIMIT);
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

export const buildPaginationMeta = (
  page: number,
  limit: number,
  totalItems: number,
): { page: number; limit: number; totalItems: number; totalPages: number } => ({
  page,
  limit,
  totalItems,
  totalPages: Math.ceil(totalItems / limit) || 0,
});
