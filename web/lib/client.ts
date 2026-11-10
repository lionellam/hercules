// Screen-side helpers: calling the app's API, the in-memory cache, the online check and money formatting
import { useCallback, useEffect, useRef, useState } from "react";

export const fmt = (n: number) => n.toLocaleString("en-SG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, headers: { "Content-Type": "application/json" } });
  if (res.status === 401) {
    window.location.href = "/signin";
    throw new Error("Not signed in");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Something went wrong. Please try again.");
  return data as T;
}

export function useOnline() {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);
  return online;
}

export const expensesUrl = (month: string) => `/api/expenses?month=${month}`;
export const summaryUrl = (month: string) => `/api/summary?month=${month}`;

// Holds API responses in memory only, so they are gone once the app closes or the user signs out
export function useApiCache() {
  const [data, setData] = useState<Record<string, unknown>>({});
  // The newest request for each URL still in flight; older responses are ignored so they can't overwrite newer data
  const pending = useRef(new Map<string, object>());

  const load = useCallback((url: string, force = false) => {
    if (!force && pending.current.has(url)) return;
    const request = {};
    pending.current.set(url, request);
    const isNewest = () => pending.current.get(url) === request;
    api<unknown>(url)
      .then((result) => {
        if (isNewest()) setData((d) => ({ ...d, [url]: result }));
      })
      .catch(() => {
        // Keep what's already showing; every cached endpoint returns a list
        if (isNewest()) setData((d) => (url in d ? d : { ...d, [url]: [] }));
      })
      .finally(() => {
        if (isNewest()) pending.current.delete(url);
      });
  }, []);

  // Goes up with every save, edit or delete in the app, so anything prepared from the data can tell it's out of date
  const [version, setVersion] = useState(0);

  const reloadAll = () => {
    setVersion((v) => v + 1);
    for (const url of new Set([...Object.keys(data), ...pending.current.keys()])) load(url, true);
  };

  return { data, load, reloadAll, version };
}
export type ApiCache = ReturnType<typeof useApiCache>;

// Returns the last-loaded response straight away, and fetches a fresh copy each time a screen opens.
// Pass null to skip loading (hooks can't be called conditionally).
export function useCached<T>({ data, load }: ApiCache, url: string | null) {
  useEffect(() => {
    if (url) load(url);
  }, [load, url]);
  return url ? (data[url] as T | undefined) : undefined;
}
