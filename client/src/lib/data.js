import { cache } from "react";
import { apiRequest } from "@/api/apiHandler";

// Server-side data for public pages. Every call returns a plain fallback if the API is unreachable,
// so a page still renders (with less content) instead of failing.
const HOUR = 3600;
const FIVE_MINUTES = 300;

const load = async (request, fallback) => {
  const res = await apiRequest(request);
  return res?.success ? res.data : fallback;
};

export const getSeoSettings = () =>
  load({ url: "/seo/settings", revalidate: FIVE_MINUTES }, { "seo.default": {}, "seo.pages": {} });

export const getCities = () => load({ url: "/catalog/cities", revalidate: HOUR, tags: ["cities"] }, []);
export const getMakes = () => load({ url: "/catalog/makes", revalidate: HOUR, tags: ["makes"] }, []);
export const getCategoryTree = () => load({ url: "/categories", revalidate: HOUR, tags: ["categories"] }, []);
export const getPopularCategories = () => load({ url: "/categories", params: { popular: "true" }, revalidate: HOUR, tags: ["categories"] }, []);
export const getFeaturedAds = (limit = 8) => load({ url: "/ads/featured", params: { limit }, revalidate: FIVE_MINUTES }, []);
export const getAdTotal = async () => (await load({ url: "/ads", params: { limit: 1 }, revalidate: FIVE_MINUTES }, null))?.pagination?.total ?? 0;

/** Cheapest active package price, for "listings from AED x" copy. */
export const getStartingPackagePrice = async () => {
  const groups = await load({ url: "/packages", revalidate: HOUR }, []);
  const prices = groups.flatMap((g) => g.packages.map((p) => Number(p.amount))).filter((n) => n > 0);
  return prices.length ? Math.min(...prices) : null;
};

/** Listing search. Params are the public `GET /ads` filters, passed straight through. */
export const searchAds = async (params) => {
  const res = await apiRequest({ url: "/ads", params, revalidate: 60 });
  return res?.success ? res.data : { items: [], pagination: { total: 0, page: 1, limit: 12, totalPages: 0, hasNext: false, hasPrev: false } };
};

/** One ad by slug. Never cached: each visit counts as a view, and owners can open their own unpublished ads. */
// Wrapped in React `cache` so generateMetadata and the page share one request (and count one view).
export const getAd = cache(async (slug) => {
  const res = await apiRequest({ url: `/ads/${encodeURIComponent(slug)}`, cache: "no-store", withCredentials: true });
  return res?.success ? res.data : null;
});

/** Active packages grouped by package category, cheapest first. */
export const getPackages = () => load({ url: "/packages", revalidate: HOUR }, []);

/** One category with its breadcrumb and children, or null if it doesn't exist. */
export const getCategory = async (slug) => {
  const res = await apiRequest({ url: `/categories/${encodeURIComponent(slug)}`, revalidate: HOUR, tags: ["categories"] });
  return res?.success ? res.data : null;
};

/** Which social sign-in buttons to show: { google: bool, facebook: bool }. */
export const getSocialProviders = () => load({ url: "/auth/providers", revalidate: FIVE_MINUTES }, { google: false, facebook: false });
