import prisma from "../config/prisma.js";
import { ApiError } from "../utils/error.js";

// Site settings are key/value JSON. Every writable key has a validator that returns the cleaned value,
// so nothing arbitrary can be stored. The Next.js frontend reads the `seo.*` keys to build its metadata.
const text = (value, max, name, { required = false } = {}) => {
    if (value === undefined || value === null || value === "") {
        if (required) throw ApiError.badRequest(`${name} is required`);
        return "";
    }
    if (typeof value !== "string") throw ApiError.badRequest(`${name} must be text`);
    const trimmed = value.trim();
    if (trimmed.length > max) throw ApiError.badRequest(`${name} must be at most ${max} characters`);
    return trimmed;
};

const keywords = (value, name) => {
    if (value === undefined || value === null) return [];
    if (!Array.isArray(value) || value.length > 30) throw ApiError.badRequest(`${name} must be a list of at most 30 keywords`);
    return value.map((k) => text(k, 50, name)).filter(Boolean);
};

const httpsUrl = (value, name) => {
    const url = text(value, 512, name);
    if (url && !/^https?:\/\//i.test(url)) throw ApiError.badRequest(`${name} must be an http(s) URL`);
    return url;
};

const pageMeta = (value, name) => {
    if (!value || typeof value !== "object" || Array.isArray(value)) throw ApiError.badRequest(`${name} must be an object`);
    return {
        title: text(value.title, 120, `${name}.title`),
        description: text(value.description, 300, `${name}.description`),
        keywords: keywords(value.keywords, `${name}.keywords`),
        ogImageUrl: httpsUrl(value.ogImageUrl, `${name}.ogImageUrl`),
    };
};

export const SETTINGS = {
    // Site-wide defaults. titleTemplate uses %s for the page title, e.g. "%s | TheRentalz".
    "seo.default": (value) => ({
        siteName: text(value?.siteName, 80, "siteName", { required: true }),
        titleTemplate: text(value?.titleTemplate, 120, "titleTemplate") || "%s",
        ...pageMeta(value, "seo.default"),
    }),
    // Per-page overrides for fixed pages, keyed by route slug: home, rent, sell, contact, packages, ...
    "seo.pages": (value) => {
        if (!value || typeof value !== "object" || Array.isArray(value)) throw ApiError.badRequest("seo.pages must be an object");
        const entries = Object.entries(value);
        if (entries.length > 50) throw ApiError.badRequest("seo.pages can hold at most 50 pages");
        return Object.fromEntries(
            entries.map(([page, meta]) => {
                if (!/^[a-z0-9][a-z0-9-_]{0,39}$/.test(page)) throw ApiError.badRequest(`Invalid page key "${page}"`);
                return [page, pageMeta(meta, `seo.pages.${page}`)];
            }),
        );
    },
};

export const PUBLIC_SETTING_KEYS = ["seo.default", "seo.pages"];

const DEFAULTS = {
    "seo.default": { siteName: "TheRentalz", titleTemplate: "%s | TheRentalz", title: "TheRentalz", description: "", keywords: [], ogImageUrl: "" },
    "seo.pages": {},
};

export const readSettings = async (keys) => {
    const rows = await prisma.setting.findMany({ where: { key: { in: keys } } });
    const stored = new Map(rows.map((r) => [r.key, r.value]));
    return Object.fromEntries(keys.map((key) => [key, stored.get(key) ?? DEFAULTS[key] ?? null]));
};

export const writeSetting = async (key, value) => {
    const validate = SETTINGS[key];
    if (!validate) throw ApiError.badRequest(`Unknown setting. Available: ${Object.keys(SETTINGS).join(", ")}`);
    const clean = validate(value);
    await prisma.setting.upsert({ where: { key }, update: { value: clean }, create: { key, value: clean } });
    return clean;
};
