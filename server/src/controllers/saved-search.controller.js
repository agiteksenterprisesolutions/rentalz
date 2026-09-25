import prisma from "../config/prisma.js";
import { buildAdFilters, publicAdWhere, SORTS } from "../services/ad-search.service.js";
import { apiResponse, asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/error.js";

const MAX_SAVED_SEARCHES = 20;

// Only the filters GET /ads understands are stored; anything else in the body is dropped.
const FILTER_KEYS = [
    "q", "type", "city", "category", "make", "operator", "insurance", "warranty", "fuelType",
    "minPrice", "maxPrice", "minYear", "maxYear", "featured", "sort",
];

const cleanFilters = async (input) => {
    if (!input || typeof input !== "object" || Array.isArray(input)) throw ApiError.badRequest("filters must be an object");

    const filters = {};
    for (const key of FILTER_KEYS) {
        const value = input[key];
        if (value === undefined || value === null || value === "") continue;
        if (!["string", "number", "boolean"].includes(typeof value)) throw ApiError.badRequest(`Invalid value for ${key}`);
        filters[key] = typeof value === "string" ? value.trim().slice(0, 100) : value;
    }
    if (!Object.keys(filters).length) throw ApiError.badRequest("Choose at least one filter to save");
    if (filters.sort && !SORTS[filters.sort]) throw ApiError.badRequest("Invalid sort");

    await buildAdFilters(filters, publicAdWhere()); // throws a 400/404 for invalid values, so nothing unusable is stored
    return filters;
};

// GET /saved-searches
export const listSavedSearches = asyncHandler(async (req, res) => {
    const searches = await prisma.savedSearch.findMany({ where: { userId: req.user.id }, orderBy: { createdAt: "desc" } });
    return apiResponse(res, 200, true, "Saved searches", searches);
});

// POST /saved-searches  { name?, filters }
export const createSavedSearch = asyncHandler(async (req, res) => {
    const filters = await cleanFilters(req.body?.filters);
    const name = req.body?.name ? String(req.body.name).trim().slice(0, 120) : null;

    if ((await prisma.savedSearch.count({ where: { userId: req.user.id } })) >= MAX_SAVED_SEARCHES) {
        throw ApiError.badRequest(`You can save up to ${MAX_SAVED_SEARCHES} searches`);
    }
    const search = await prisma.savedSearch.create({ data: { userId: req.user.id, name, filters } });
    return apiResponse(res, 201, true, "Search saved", search);
});

// DELETE /saved-searches/:id — only the owner's own search can be removed
export const deleteSavedSearch = asyncHandler(async (req, res) => {
    const result = await prisma.savedSearch.deleteMany({ where: { id: req.params.id, userId: req.user.id } });
    if (!result.count) throw ApiError.notFound("Saved search not found");
    return apiResponse(res, 200, true, "Saved search deleted");
});
