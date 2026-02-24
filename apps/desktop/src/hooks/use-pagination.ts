import { useState, useCallback } from 'react';
import { DEFAULT_PAGE_SIZE } from '@ssm/shared';

export function usePagination(initialLimit = DEFAULT_PAGE_SIZE) {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(initialLimit);
  const [search, setSearch] = useState('');

  const resetPage = useCallback(() => setPage(1), []);

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  return {
    page,
    limit,
    search,
    setPage,
    setLimit,
    setSearch: handleSearchChange,
    resetPage,
    params: { page, limit, search: search || undefined },
  };
}
