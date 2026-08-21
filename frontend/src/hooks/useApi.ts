import { useState, useEffect, useCallback, useRef } from 'react';
import type { PaginatedResponse } from '@/types';

interface UseFetchResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useFetch<T>(
  fetcher: () => Promise<T>,
  deps: unknown[] = [],
): UseFetchResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const mountedRef = useRef(true);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    mountedRef.current = true;
    let cancelled = false;

    setLoading(true);
    setError(null);

    fetcher()
      .then((result) => {
        if (!cancelled && mountedRef.current) {
          setData(result);
        }
      })
      .catch((err) => {
        if (!cancelled && mountedRef.current) {
          setError(err instanceof Error ? err.message : 'Unknown error');
        }
      })
      .finally(() => {
        if (!cancelled && mountedRef.current) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, ...deps]);

  return { data, loading, error, refetch };
}

interface PaginationParams {
  page: number;
  page_size: number;
  [key: string]: string | number | boolean | null | undefined;
}

interface UsePaginationResult<T> {
  data: T[];
  page: number;
  setPage: (p: number) => void;
  total: number;
  totalPages: number;
  loading: boolean;
  error: string | null;
  params: PaginationParams;
  setParams: (p: Partial<PaginationParams>) => void;
  refetch: () => void;
}

export function usePagination<T>(
  fetcher: (params: PaginationParams) => Promise<PaginatedResponse<T>>,
  initialParams: Partial<PaginationParams> = {},
): UsePaginationResult<T> {
  const [params, setParamsState] = useState<PaginationParams>({
    page: 1,
    page_size: 20,
    ...initialParams,
  });
  const [data, setData] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const mountedRef = useRef(true);

  const setPage = useCallback((page: number) => {
    setParamsState((prev) => ({ ...prev, page }));
  }, []);

  const setParams = useCallback((p: Partial<PaginationParams>) => {
    setParamsState((prev) => ({ ...prev, ...p, page: p.page ?? 1 }));
  }, []);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    mountedRef.current = true;
    let cancelled = false;

    setLoading(true);
    setError(null);

    fetcher(params)
      .then((result) => {
        if (!cancelled && mountedRef.current) {
          setData(result.items);
          setTotal(result.total);
          setTotalPages(result.total_pages);
        }
      })
      .catch((err) => {
        if (!cancelled && mountedRef.current) {
          setError(err instanceof Error ? err.message : 'Unknown error');
        }
      })
      .finally(() => {
        if (!cancelled && mountedRef.current) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, JSON.stringify(params)]);

  return {
    data,
    page: params.page,
    setPage,
    total,
    totalPages,
    loading,
    error,
    params,
    setParams,
    refetch,
  };
}
