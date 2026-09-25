"use client";

import Link from "next/link";
import AdCard from "@/components/ads/AdCard";
import Pagination from "@/components/ui/Pagination";
import useFetch from "@/hooks/useFetch";
import { EmptyState, LoadState, PageHeading } from "./parts";

export default function Favourites({ page = 1 }) {
  const { data, error, loading, reload } = useFetch("/favourites", { page, limit: 12 });
  return (
    <>
      <PageHeading title="Favourites" subtitle="Listings you've saved." />
      <LoadState loading={loading} error={error} onRetry={reload}>
        {data?.items.length === 0 && <EmptyState title="No favourites yet" text="Tap the heart on any listing to keep it here." action={<Link href="/ads" className="btn btn-primary">Browse listings</Link>} />}
        {data?.items.length > 0 && (
          <>
            <div className="grid gap-space-md sm:grid-cols-2 xl:grid-cols-3">
              {data.items.map((ad) => (
                // Un-saving removes the card, so the list is reloaded.
                <AdCard key={ad.id} ad={ad} onFavouriteChange={(saved) => !saved && reload()} />
              ))}
            </div>
            <Pagination page={data.pagination.page} totalPages={data.pagination.totalPages} buildHref={(p) => `/dashboard/favourites?page=${p}`} />
          </>
        )}
      </LoadState>
    </>
  );
}
