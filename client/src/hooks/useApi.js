import { useCallback, useEffect, useState } from "react";
import api from "../services/api";

/**
 * Loads data from a GET endpoint and tracks loading / error state.
 *
 *   const { data, loading, error, reload, setData } = useApi("/profiles/me");
 *
 * – Re-fetches whenever `path` changes (e.g. a new page or filter).
 * – Pass null as the path to skip fetching (e.g. until a value is known).
 * – reload() fetches again, e.g. after accepting a request.
 * – setData() lets a page update the list locally without refetching.
 *
 * The `ignore` flag stops an old, slow response from overwriting a
 * newer one when the user changes filters quickly.
 */
export default function useApi(path) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(Boolean(path));
  const [error, setError] = useState(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!path) {
      setLoading(false);
      return;
    }

    let ignore = false;
    setLoading(true);
    setError(null);

    api
      .get(path)
      .then((result) => {
        if (!ignore) setData(result);
      })
      .catch((err) => {
        if (!ignore) setError(err);
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [path, version]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);

  return { data, loading, error, reload, setData };
}
