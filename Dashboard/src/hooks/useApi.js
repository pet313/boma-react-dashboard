import { useState, useEffect, useCallback, useRef } from "react";

/**
 * Generic async data-fetching hook.
 *
 * Usage:
 *   const { data, loading, error, refetch } = useApi(() => mobsApi.getAll());
 *
 * Features:
 *   - Cancels stale requests via AbortController
 *   - Returns loading/error/data states
 *   - `refetch()` triggers a fresh call
 */
export function useApi(fetchFn, deps = []) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const abortRef = useRef(null);

  const execute = useCallback(async () => {
    // Cancel any in-flight request
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    setLoading(true);
    setError(null);

    try {
      const result = await fetchFn(abortRef.current.signal);
      setData(result);
    } catch (err) {
      if (err.name !== "AbortError") {
        setError(err.message || "Unknown error");
      }
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    execute();
    return () => abortRef.current?.abort();
  }, [execute]);

  return { data, loading, error, refetch: execute };
}

/**
 * Mutation hook — for POST/PUT/DELETE calls triggered by user action.
 *
 * Usage:
 *   const { mutate, loading, error } = useMutation(usersApi.toggle);
 *   await mutate(userId);
 */
export function useMutation(mutFn) {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const mutate = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    try {
      const result = await mutFn(...args);
      return result;
    } catch (err) {
      const msg = err.message || "Request failed";
      setError(msg);
      throw err;   // re-throw so callers can handle in their own try/catch
    } finally {
      setLoading(false);
    }
  }, [mutFn]);

  return { mutate, loading, error };
}
