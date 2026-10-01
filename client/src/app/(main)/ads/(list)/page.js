import { SearchX } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import AdCard from "@/components/ads/AdCard";
import SaveSearchButton from "@/components/ads/SaveSearchButton";
import AdFilters from "@/components/ads/AdFilters";
import { FilterTransitionProvider } from "@/components/ads/FilterTransitionProvider";
import { SORT_OPTIONS } from "@/components/ads/filterOptions";
import ResultsPendingOverlay from "@/components/ads/ResultsPendingOverlay";
import Pagination from "@/components/ui/Pagination";
import { getCategoryTree, getCities, getMakes, getSeoSettings, searchAds } from "@/lib/data";
import { buildMetadata } from "@/lib/seo";
import { AD_TYPE_LABELS } from "@/utils/format";

const FILTER_KEYS = ["q", "type", "city", "category", "make", "minPrice", "maxPrice", "sort"];
const PAGE_SIZE = 12;

// Only known keys, first value only, so nothing unexpected is forwarded to the API.
const readFilters = (searchParams) =>
  Object.fromEntries(
    FILTER_KEYS.map((key) => {
      const raw = searchParams[key];
      return [key, (Array.isArray(raw) ? raw[0] : raw)?.toString().trim().slice(0, 100) || undefined];
    }).filter(([, value]) => value)
  );

export async function generateMetadata({ searchParams }) {
  const filters = readFilters(await searchParams);
  const seo = await getSeoSettings();
  const type = AD_TYPE_LABELS[filters.type];
  const metadata = buildMetadata(seo, "ads", {
    path: "/ads",
    title: `${type ? `${type}: ` : ""}Equipment and vehicles for rent and sale in the UAE | TheRentalz`,
    description: "Browse heavy equipment, machinery and vehicles for rent or sale across the UAE. Compare daily, weekly and monthly prices from verified sellers.",
  });
  // Filtered and paged views are not separate pages for search engines.
  return Object.keys(filters).length ? { ...metadata, robots: { index: false, follow: true } } : metadata;
}

export default async function AdsPage({ searchParams }) {
  const raw = await searchParams;
  const filters = readFilters(raw);
  const page = Math.max(1, Number.parseInt(raw.page, 10) || 1);

  const [result, cities, categories, makes] = await Promise.all([
    searchAds({ ...filters, page, limit: PAGE_SIZE }),
    getCities(),
    getCategoryTree(),
    getMakes(),
  ]);
  const { items, pagination } = result;

  const activeCount = Object.keys(filters).filter((k) => k !== "sort").length;
  const buildHref = (p) => {
    const query = new URLSearchParams({ ...filters, ...(p > 1 && { page: p }) }).toString();
    return `/ads${query ? `?${query}` : ""}`;
  };

  const cityName = cities.find((c) => String(c.id) === filters.city)?.name;
  const categoryTitle = categories.flatMap((m) => [m, ...m.children]).find((c) => c.slug === filters.category)?.title;
  const heading = categoryTitle ?? (filters.type ? AD_TYPE_LABELS[filters.type] : "All listings");
  const sortLabel = SORT_OPTIONS.find((o) => o.value === filters.sort)?.label;

  return (
    <div className="container-page py-space-xl">
      <nav aria-label="Breadcrumb" className="type-label-mono-md text-neutral-700">
        <Link href="/" className="hover:text-neutral-900">Home</Link> / <span aria-current="page">Listings</span>
      </nav>

      <header className="mt-space-md mb-space-lg">
        <h1 className="type-headline-lg">
          {heading}
          {cityName && <span className="text-neutral-700"> in {cityName}</span>}
        </h1>
        <p className="type-body-md mt-space-sm text-neutral-700" aria-live="polite">
          {pagination.total === 0
            ? "No listings match your search."
            : `${pagination.total.toLocaleString("en-US")} ${pagination.total === 1 ? "listing" : "listings"}${filters.q ? ` for “${filters.q}”` : ""}${sortLabel ? ` · ${sortLabel.toLowerCase()}` : ""}`}
        </p>
        {activeCount > 0 && pagination.total > 0 && (
          <div className="mt-space-md">
            <SaveSearchButton filters={filters} name={[heading, cityName].filter(Boolean).join(" in ").slice(0, 120)} />
          </div>
        )}
      </header>

      <FilterTransitionProvider>
        <div className="grid gap-space-lg lg:grid-cols-[18rem_1fr] lg:items-start">
          <Suspense fallback={null}>
            <AdFilters cities={cities} categories={categories} makes={makes} />
          </Suspense>

          <ResultsPendingOverlay>
            <section aria-label="Search results">
              {items.length > 0 ? (
                <>
                  <div className="grid gap-space-md sm:grid-cols-2 xl:grid-cols-3">
                    {items.map((ad, i) => (
                      <AdCard key={ad.id} ad={ad} priority={i < 3} />
                    ))}
                  </div>
                  <Pagination page={pagination.page} totalPages={pagination.totalPages} buildHref={buildHref} />
                </>
              ) : (
                <div className="card flex flex-col items-center gap-space-md p-space-xl text-center">
                  <SearchX aria-hidden="true" className="size-10 text-neutral-400" />
                  <h2 className="type-headline-md">Nothing found</h2>
                  <p className="type-body-md max-w-md text-neutral-700">Try a broader keyword, remove a filter, or browse every listing.</p>
                  <Link href="/ads" className="btn btn-primary">Clear all filters</Link>
                </div>
              )}
            </section>
          </ResultsPendingOverlay>
        </div>
      </FilterTransitionProvider>
    </div>
  );
}
