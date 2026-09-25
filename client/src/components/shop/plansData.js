// Helpers shared by the plans page sections. Everything is derived from the API's package groups,
// so editing a plan in the admin changes the page.
import { formatAed } from "@/utils/format";

export const durationText = (p) => `${p.durationValue} ${p.durationUnit === "MONTH" ? "month" : "day"}${p.durationValue === 1 ? "" : "s"}`;
export const optionLabel = (days) => (days === 0 ? "Standard listing" : `Featured for ${days} ${days === 1 ? "day" : "days"}`);
export const perAdText = (p) => (p.adCount > 1 ? `${formatAed(Math.round((Number(p.amount) / p.adCount) * 100) / 100)} per ad` : null);

/** The plan a tier is priced from: its standard listing, else its cheapest option. */
export const baseOf = (group) => group.packages.find((p) => p.featuredDays === 0) ?? [...group.packages].sort((a, b) => a.amount - b.amount)[0];

/** A group where every package covers one ad is a single-ad plan; the rest are business tiers. */
export const isSingle = (group) => group.packages.every((p) => p.adCount === 1);

// "All options", "Featured options only" or null, for a feature only some of a tier's options include.
export const coverage = (packages, key) => {
  const on = packages.filter((p) => p[key]).length;
  return on === 0 ? null : on === packages.length ? "All options" : "Featured options";
};

/** Headline numbers for the hero and the summary strip. */
export const summarise = (groups) => {
  const all = groups.flatMap((g) => g.packages);
  const durations = [...new Set(all.map(durationText))];
  return {
    plans: all.length,
    tiers: groups.length,
    minPrice: Math.min(...all.map((p) => Number(p.amount))),
    maxAds: Math.max(...all.map((p) => p.adCount)),
    maxFeaturedDays: Math.max(...all.map((p) => p.featuredDays)),
    minFeaturedDays: Math.min(...all.filter((p) => p.featuredDays > 0).map((p) => p.featuredDays)),
    duration: durations.length === 1 ? durations[0] : null,
  };
};
