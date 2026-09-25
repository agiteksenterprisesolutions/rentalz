"use client";

import { Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { api } from "@/api/api";
import useFetch, { apiError } from "@/hooks/useFetch";
import { AD_TYPE_LABELS } from "@/utils/format";
import { EmptyState, LoadState, PageHeading } from "./parts";

const LABELS = { q: "Keyword", type: "Type", city: "Emirate", category: "Category", make: "Make", minPrice: "Min price", maxPrice: "Max price", sort: "Sort" };
// `names` maps ids to readable names: { city: { 4: "Dubai" }, make: { 1: "Caterpillar" } }
const describe = (filters, names) =>
  Object.entries(filters ?? {})
    .filter(([key, value]) => LABELS[key] && value !== "" && value != null)
    .map(([key, value]) => `${LABELS[key]}: ${key === "type" ? (AD_TYPE_LABELS[value] ?? value) : (names[key]?.[value] ?? value)}`);

export default function SavedSearches() {
  const { data, error, loading, reload } = useFetch("/saved-searches");
  const cities = useFetch("/catalog/cities").data;
  const makes = useFetch("/catalog/makes").data;
  const names = {
    city: Object.fromEntries((cities ?? []).map((c) => [c.id, c.name])),
    make: Object.fromEntries((makes ?? []).map((m) => [m.id, m.name])),
  };
  const [failure, setFailure] = useState(null);
  const items = Array.isArray(data) ? data : (data?.items ?? []);

  const remove = async (id) => {
    setFailure(null);
    try {
      await api.delete(`/saved-searches/${id}`);
      reload();
    } catch (e) {
      setFailure(apiError(e));
    }
  };

  return (
    <>
      <PageHeading title="Saved searches" subtitle="Run a search again in one click." />
      {failure && <p role="alert" className="field-error mb-space-md">{failure}</p>}
      <LoadState loading={loading} error={error} onRetry={reload}>
        {data && items.length === 0 && <EmptyState title="No saved searches" text="Filter the listings, then choose “Save this search”." action={<Link href="/ads" className="btn btn-primary">Browse listings</Link>} />}
        {items.length > 0 && (
          <ul className="flex flex-col gap-space-md">
            {items.map((s) => (
              <li key={s.id} className="card flex flex-wrap items-center justify-between gap-space-md p-space-md">
                <div className="min-w-0">
                  <h2 className="type-headline-sm">{s.name || "Saved search"}</h2>
                  <p className="type-label-mono-md text-neutral-700">{describe(s.filters, names).join(" · ") || "All listings"}</p>
                </div>
                <div className="flex gap-2">
                  <Link href={`/ads?${new URLSearchParams(Object.fromEntries(Object.entries(s.filters ?? {}).filter(([, v]) => v !== "" && v != null)))}`} className="btn btn-primary btn-sm">Run search</Link>
                  <button type="button" onClick={() => remove(s.id)} aria-label={`Delete saved search ${s.name || ""}`} className="btn btn-ghost btn-sm"><Trash2 aria-hidden="true" />Delete</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </LoadState>
    </>
  );
}
