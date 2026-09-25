import prisma from "../config/prisma.js";
import { AdStatus, AdType, OperatorOption } from "../generated/prisma/enums.ts";
import { ApiError } from "../utils/error.js";

// Ads visible to everyone: approved, not deleted and not past their end date.
export const publicAdWhere = () => ({
    status: AdStatus.APPROVED,
    deletedAt: null,
    OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
});

// Featured right now: flagged, and either open-ended or not yet past its end date.
export const featuredNowWhere = () => ({
    isFeatured: true,
    OR: [{ featuredUntil: null }, { featuredUntil: { gt: new Date() } }],
});

// Lean card shape used by every listing (home, search, my ads, moderation queue).
export const adCardSelect = {
    id: true,
    slug: true,
    type: true,
    status: true,
    title: true,
    price: true,
    dailyPrice: true,
    weeklyPrice: true,
    monthlyPrice: true,
    currency: true,
    modelYear: true,
    isFeatured: true,
    priority: true,
    expiresAt: true,
    createdAt: true,
    city: { select: { id: true, name: true, slug: true } },
    make: { select: { id: true, name: true } },
    mainCategory: { select: { id: true, title: true, slug: true } },
    photos: { select: { id: true, key: true, position: true }, orderBy: { position: "asc" }, take: 1 },
};

export const SORTS = {
    newest: [{ createdAt: "desc" }],
    oldest: [{ createdAt: "asc" }],
    price_asc: [{ price: "asc" }, { createdAt: "desc" }],
    price_desc: [{ price: "desc" }, { createdAt: "desc" }],
    featured: [{ isFeatured: "desc" }, { priority: "asc" }, { createdAt: "desc" }],
};

export const parseBool = (value) => (value === undefined || value === "" ? undefined : value === true || value === "true" || value === "1");

const parseIntParam = (value, name) => {
    if (value === undefined || value === "") return undefined;
    const n = Number.parseInt(value, 10);
    if (!Number.isInteger(n)) throw ApiError.badRequest(`${name} must be a number`);
    return n;
};

const parseMoney = (value, name) => {
    if (value === undefined || value === "") return undefined;
    const n = Number(value);
    if (!Number.isFinite(n) || n < 0) throw ApiError.badRequest(`${name} must be a positive number`);
    return n;
};

const parseEnum = (value, allowed, name) => {
    if (value === undefined || value === "") return undefined;
    const upper = String(value).toUpperCase();
    if (!Object.values(allowed).includes(upper)) throw ApiError.badRequest(`Invalid ${name}`);
    return upper;
};

// Turns free text into a safe MySQL boolean-mode query: every word (>= 3 chars) is required, prefix-matched.
const toFulltextQuery = (q) =>
    String(q)
        .toLowerCase()
        .split(/[^\p{L}\p{N}]+/u)
        .filter((word) => word.length >= 3)
        .slice(0, 8)
        .map((word) => `+${word}*`)
        .join(" ");

/**
 * Builds the Prisma `where` for the search / listing endpoints from query-string filters.
 * `base` is the visibility rule (public ads, or an owner's own ads).
 */
export const buildAdFilters = async (query, base) => {
    const and = [];

    const type = parseEnum(query.type, AdType, "type");
    if (type) and.push({ type });

    const cityId = parseIntParam(query.city, "city");
    if (cityId) and.push({ cityId });

    const makeId = parseIntParam(query.make, "make");
    if (makeId) and.push({ makeId });

    if (query.category) {
        const isId = /^\d+$/.test(String(query.category));
        const category = await prisma.category.findFirst({
            where: isId ? { id: Number(query.category) } : { slug: String(query.category) },
            select: { id: true },
        });
        if (!category) throw ApiError.notFound("Category not found");
        and.push({ OR: [{ mainCategoryId: category.id }, { subCategoryId: category.id }, { leafCategoryId: category.id }] });
    }

    const operator = parseEnum(query.operator, OperatorOption, "operator");
    if (operator) and.push({ operator });

    const insurance = parseBool(query.insurance);
    if (insurance !== undefined) and.push({ insurance });
    const warranty = parseBool(query.warranty);
    if (warranty !== undefined) and.push({ warranty });
    const featured = parseBool(query.featured);
    if (featured === true) and.push(featuredNowWhere());
    else if (featured === false) and.push({ isFeatured: false });

    if (query.fuelType) and.push({ fuelType: String(query.fuelType).slice(0, 50) });

    const minPrice = parseMoney(query.minPrice, "minPrice");
    const maxPrice = parseMoney(query.maxPrice, "maxPrice");
    if (minPrice !== undefined || maxPrice !== undefined) {
        and.push({ price: { ...(minPrice !== undefined && { gte: minPrice }), ...(maxPrice !== undefined && { lte: maxPrice }) } });
    }

    const minYear = parseIntParam(query.minYear, "minYear");
    const maxYear = parseIntParam(query.maxYear, "maxYear");
    if (minYear !== undefined || maxYear !== undefined) {
        and.push({ modelYear: { ...(minYear !== undefined && { gte: minYear }), ...(maxYear !== undefined && { lte: maxYear }) } });
    }

    if (query.q && String(query.q).trim()) {
        const term = toFulltextQuery(query.q);
        and.push(
            term
                ? {
                      OR: [
                          { title: { search: term } },
                          { description: { search: term } },
                          { make: { name: { contains: String(query.q).trim().slice(0, 50) } } },
                          { model: { contains: String(query.q).trim().slice(0, 50) } },
                      ],
                  }
                : { title: { contains: String(query.q).trim().slice(0, 100) } }, // words too short for the fulltext index
        );
    }

    return { AND: [base, ...and] };
};

export const getSort = (sort) => {
    if (sort === undefined || sort === "") return SORTS.newest;
    if (!SORTS[sort]) throw ApiError.badRequest(`sort must be one of: ${Object.keys(SORTS).join(", ")}`);
    return SORTS[sort];
};
