import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';

export function useApi<T>(url: string | null, deps: any[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(!!url);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(() => {
    if (!url) return;
    setLoading(true);
    api.get(url)
      .then((res) => { setData(res.data); setError(null); })
      .catch((err) => setError(err.response?.data?.message ?? 'Fout bij ophalen'))
      .finally(() => setLoading(false));
  }, [url, ...deps]);

  useEffect(() => { refetch(); }, [refetch]);

  return { data, loading, error, refetch, setData };
}
