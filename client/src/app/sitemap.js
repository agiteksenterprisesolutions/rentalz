import { apiRequest } from "@/api/apiHandler";
import { siteUrl } from "@/lib/seo";

export const revalidate = 3600;

const STATIC_PAGES = ["", "/ads", "/categories", "/packages", "/contact", "/terms", "/privacy-policy"];
const MAX_AD_PAGES = 9; // 9 x 5000 ads keeps the file under the 50,000 URL limit

const feed = async (url, params) => {
  const res = await apiRequest({ url, params, revalidate });
  return res?.success ? res.data : null;
};

export default async function sitemap() {
  const base = siteUrl();
  const now = new Date();

  const categories = (await feed("/seo/sitemap/categories"))?.items ?? [];

  const ads = [];
  const first = await feed("/seo/sitemap/ads", { page: 1 });
  if (first) {
    ads.push(...first.items);
    const pages = Math.min(first.totalPages, MAX_AD_PAGES);
    for (let page = 2; page <= pages; page++) ads.push(...((await feed("/seo/sitemap/ads", { page }))?.items ?? []));
  }

  return [
    ...STATIC_PAGES.map((path) => ({ url: `${base}${path}`, lastModified: now, changeFrequency: path === "" || path === "/ads" ? "daily" : "monthly", priority: path === "" ? 1 : 0.6 })),
    ...categories.map((c) => ({ url: `${base}/categories/${c.slug}`, lastModified: new Date(c.updatedAt), changeFrequency: "weekly", priority: 0.7 })),
    ...ads.map((a) => ({ url: `${base}/ads/${a.slug}`, lastModified: new Date(a.updatedAt), changeFrequency: "weekly", priority: 0.8 })),
  ];
}
