// Plain data, not a client component — AdFilters (client) and the /ads page (server) both need these values, and
// an export from a "use client" module can't be read as a plain value from server code.
export const SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
  { value: "featured", label: "Featured first" },
  { value: "oldest", label: "Oldest first" },
];

export const AD_TYPE_OPTIONS = [
  { value: "", label: "All" },
  { value: "RENT", label: "Rent" },
  { value: "SELL", label: "Buy" },
  { value: "PREMIUM", label: "Premium" },
];
