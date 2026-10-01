"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import FilterPanel from "./FilterPanel";
import { useFilterTransition } from "./FilterTransitionProvider";
import { AD_TYPE_OPTIONS as TYPES, SORT_OPTIONS } from "./filterOptions";

const DEBOUNCE_MS = 400;
// Keys that live in the URL. "sort" is tracked separately since it doesn't count toward "N filters active".
const FILTER_KEYS = ["q", "type", "city", "category", "make", "minPrice", "maxPrice"];

// Updates the URL's search params as the person fills the form, instead of waiting for a submit — selects and the
// type radio apply immediately, free-text/number fields debounce so every keystroke doesn't trigger a fetch. Each
// change goes through startTransition (shared with ResultsPendingOverlay) so the old results stay visible,
// slightly dimmed, until the new ones arrive — no full navigation, no blank page.
export default function AdFilters({ cities, categories, makes }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { startTransition } = useFilterTransition();
  const timers = useRef({});

  const values = Object.fromEntries(FILTER_KEYS.map((key) => [key, searchParams.get(key) ?? ""]));
  const sort = searchParams.get("sort") ?? "newest";
  const activeCount = FILTER_KEYS.filter((key) => values[key]).length;

  // Text/number inputs need their own state so a keystroke shows up instantly, ahead of the debounced URL update.
  const [text, setText] = useState({ q: values.q, minPrice: values.minPrice, maxPrice: values.maxPrice });
  const searchKey = searchParams.toString();
  useEffect(() => {
    setText({ q: values.q, minPrice: values.minPrice, maxPrice: values.maxPrice });
    // Re-sync whenever the URL changes externally (Clear button, browser back/forward) or once our own debounced
    // commit lands; values/pathname are derived from searchParams, so searchKey alone is the real dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchKey]);

  useEffect(() => () => Object.values(timers.current).forEach(clearTimeout), []);

  const commit = (next) => {
    const params = new URLSearchParams(searchParams);
    Object.entries(next).forEach(([key, value]) => (value ? params.set(key, value) : params.delete(key)));
    params.delete("page"); // any filter change starts back at page 1
    startTransition(() => router.replace(`${pathname}${params.toString() ? `?${params}` : ""}`, { scroll: false }));
  };

  const setNow = (key, value) => {
    clearTimeout(timers.current[key]);
    commit({ [key]: value });
  };

  const setDebounced = (key, value) => {
    setText((t) => ({ ...t, [key]: value }));
    clearTimeout(timers.current[key]);
    timers.current[key] = setTimeout(() => commit({ [key]: value }), DEBOUNCE_MS);
  };

  const clearAll = () => {
    Object.values(timers.current).forEach(clearTimeout);
    startTransition(() => router.replace(pathname, { scroll: false }));
  };

  return (
    <FilterPanel activeCount={activeCount}>
      <form onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-space-md px-space-md pb-space-md">
        <div>
          <label htmlFor="f-q" className="label">Keyword</label>
          <input
            id="f-q"
            type="search"
            value={text.q}
            onChange={(e) => setDebounced("q", e.target.value)}
            placeholder="Excavator, forklift…"
            className="input"
          />
        </div>

        <fieldset>
          <legend className="label">Listing type</legend>
          <div className="segmented mt-1 flex w-full [&>label]:flex-1 [&>label]:justify-center [&>label]:px-2">
            {TYPES.map((t) => (
              <label key={t.value} className="segmented-item cursor-pointer has-[:checked]:bg-white has-[:checked]:shadow-resting">
                <input
                  type="radio"
                  name="type"
                  value={t.value}
                  checked={values.type === t.value}
                  onChange={() => setNow("type", t.value)}
                  className="sr-only"
                />
                {t.label}
              </label>
            ))}
          </div>
        </fieldset>

        <div>
          <label htmlFor="f-category" className="label">Category</label>
          <select id="f-category" value={values.category} onChange={(e) => setNow("category", e.target.value)} className="select">
            <option value="">All categories</option>
            {categories.map((main) => (
              <optgroup key={main.id} label={main.title}>
                <option value={main.slug}>All in {main.title}</option>
                {main.children.map((child) => (
                  <option key={child.id} value={child.slug}>{child.title}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="f-city" className="label">Emirate</label>
          <select id="f-city" value={values.city} onChange={(e) => setNow("city", e.target.value)} className="select">
            <option value="">All emirates</option>
            {cities.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="f-make" className="label">Make</label>
          <select id="f-make" value={values.make} onChange={(e) => setNow("make", e.target.value)} className="select">
            <option value="">All makes</option>
            {makes.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>

        <div>
          <span className="label">Price (AED)</span>
          <div className="mt-1 grid grid-cols-2 gap-2">
            <input
              type="number"
              min="0"
              inputMode="numeric"
              value={text.minPrice}
              onChange={(e) => setDebounced("minPrice", e.target.value)}
              placeholder="Min"
              aria-label="Minimum price"
              className="input"
            />
            <input
              type="number"
              min="0"
              inputMode="numeric"
              value={text.maxPrice}
              onChange={(e) => setDebounced("maxPrice", e.target.value)}
              placeholder="Max"
              aria-label="Maximum price"
              className="input"
            />
          </div>
        </div>

        <div>
          <label htmlFor="f-sort" className="label">Sort by</label>
          <select id="f-sort" value={sort} onChange={(e) => setNow("sort", e.target.value)} className="select">
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {activeCount > 0 && (
          <button type="button" onClick={clearAll} className="btn btn-secondary">
            Clear filters
          </button>
        )}
      </form>
    </FilterPanel>
  );
}
