import prisma from "../config/prisma.js";
import { publicAdWhere } from "../services/ad-search.service.js";
import { PUBLIC_SETTING_KEYS, readSettings } from "../services/settings.service.js";
import { apiResponse, asyncHandler } from "../utils/asyncHandler.js";
import { getPagination } from "../utils/pagination.js";

// Data feeds for the Next.js frontend, which owns the actual SEO output (generateMetadata, sitemap.js, robots.js,
// JSON-LD). Everything here is public and cacheable.
const SITEMAP_PAGE_SIZE = 5000; // well under the 50,000-URL sitemap limit

// GET /seo/settings — site-wide defaults and per-page overrides, edited by admins under /admin/settings
export const seoSettings = asyncHandler(async (req, res) => {
    res.set("Cache-Control", "public, max-age=300");
    return apiResponse(res, 200, true, "SEO settings", await readSettings(PUBLIC_SETTING_KEYS));
});

// GET /seo/sitemap/ads?page=1 and /seo/sitemap/categories — { slug, updatedAt } for every indexable URL
export const sitemapAds = asyncHandler(async (req, res) => {
    const { page, skip } = getPagination({ page: req.query.page, limit: SITEMAP_PAGE_SIZE }, { defaultLimit: SITEMAP_PAGE_SIZE, maxLimit: SITEMAP_PAGE_SIZE });
    const where = publicAdWhere();
    const [items, total] = await Promise.all([
        prisma.ad.findMany({ where, select: { slug: true, updatedAt: true }, orderBy: { id: "asc" }, skip, take: SITEMAP_PAGE_SIZE }),
        prisma.ad.count({ where }),
    ]);
    res.set("Cache-Control", "public, max-age=3600");
    return apiResponse(res, 200, true, "Ad sitemap", { items, page, totalPages: Math.max(Math.ceil(total / SITEMAP_PAGE_SIZE), 1) });
});

export const sitemapCategories = asyncHandler(async (req, res) => {
    const items = await prisma.category.findMany({ where: { isActive: true }, select: { slug: true, updatedAt: true }, orderBy: { id: "asc" } });
    res.set("Cache-Control", "public, max-age=3600");
    return apiResponse(res, 200, true, "Category sitemap", { items });
});
