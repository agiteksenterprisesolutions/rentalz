// URL helpers for list pages. Kept out of the "use client" admin parts file so server pages can call them.

/** First value of each named key from Next's searchParams, dropping empty ones. */
export const pick = (raw, keys) => Object.fromEntries(keys.map((k) => [k, (Array.isArray(raw[k]) ? raw[k][0] : raw[k]) || undefined]).filter(([, v]) => v));
export const pageOf = (raw) => Math.max(1, Number.parseInt(Array.isArray(raw.page) ? raw.page[0] : raw.page, 10) || 1);
export const hrefWith = (base, values, page) => `${base}?${new URLSearchParams({ ...values, ...(page > 1 && { page }) })}`;
