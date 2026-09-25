"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/api/api";

export const apiError = (e, fallback = "Something went wrong. Please try again.") => e?.response?.data?.message || fallback;

// GET a JSON endpoint from the browser. `params` should be stable (memoise or use primitives via a string key).
// Returns { data, error, loading, reload }; `data` is the API's `data` field.
export default function useFetch(url, params) {
  const key = JSON.stringify(params ?? {});
  const [state, setState] = useState({ data: null, error: null, loading: true });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    api
      .get(url, { params: JSON.parse(key) })
      .then((res) => !cancelled && setState({ data: res.data.data, error: null, loading: false }))
      .catch((e) => !cancelled && setState({ data: null, error: apiError(e, "We couldn't load this. Please try again."), loading: false }));
    return () => {
      cancelled = true;
    };
  }, [url, key, tick]);

  const reload = useCallback(() => {
    setState((s) => ({ ...s, loading: true }));
    setTick((t) => t + 1);
  }, []);

  return { ...state, reload };
}
