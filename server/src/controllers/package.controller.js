import prisma from "../config/prisma.js";
import { PackageDurationUnit } from "../generated/prisma/enums.ts";
import { apiResponse, asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/error.js";
import { parseBool } from "../services/ad-search.service.js";

const packageSelect = {
    id: true, categoryId: true, name: true, details: true, adCount: true, durationValue: true, durationUnit: true,
    amount: true, currency: true, featuredDays: true, hasAnalytics: true, hasSupport: true, isActive: true,
};

const groupByCategory = (categories) => categories.filter((c) => c.packages.length);

// GET /packages — active packages grouped by package category (public)
export const listPackages = asyncHandler(async (req, res) => {
    const categories = await prisma.packageCategory.findMany({
        orderBy: { sortOrder: "asc" },
        include: { packages: { where: { isActive: true }, orderBy: { amount: "asc" }, select: packageSelect } },
    });
    res.set("Cache-Control", "public, max-age=300");
    return apiResponse(res, 200, true, "Packages", groupByCategory(categories));
});

// GET /packages/manage — everything including inactive (package:update)
export const managePackages = asyncHandler(async (req, res) => {
    const categories = await prisma.packageCategory.findMany({
        orderBy: { sortOrder: "asc" },
        include: { packages: { orderBy: { amount: "asc" }, select: packageSelect } },
    });
    return apiResponse(res, 200, true, "Packages", categories);
});

const intField = (value, name, { min = 0, max = 100000 } = {}) => {
    const n = Number(value);
    if (!Number.isInteger(n) || n < min || n > max) throw ApiError.badRequest(`${name} must be a whole number between ${min} and ${max}`);
    return n;
};

const parsePackageBody = async (body, { partial = false } = {}) => {
    const has = (key) => !partial || body[key] !== undefined;
    const data = {};

    if (has("categoryId")) {
        data.categoryId = intField(body.categoryId, "categoryId", { min: 1 });
        if (!(await prisma.packageCategory.findUnique({ where: { id: data.categoryId }, select: { id: true } }))) throw ApiError.badRequest("Unknown package category");
    }
    if (has("name")) {
        const name = String(body.name ?? "").trim();
        if (!name || name.length > 191) throw ApiError.badRequest("Name is required (max 191 characters)");
        data.name = name;
    }
    if (body.details !== undefined) data.details = body.details ? String(body.details).trim().slice(0, 5000) : null;
    if (has("adCount")) data.adCount = intField(body.adCount, "adCount", { min: 1, max: 10000 });
    if (body.durationValue !== undefined) data.durationValue = intField(body.durationValue, "durationValue", { min: 1, max: 3650 });
    if (body.durationUnit !== undefined) {
        const unit = String(body.durationUnit).toUpperCase();
        if (!Object.values(PackageDurationUnit).includes(unit)) throw ApiError.badRequest("Invalid durationUnit");
        data.durationUnit = unit;
    }
    if (has("amount")) {
        const amount = Number(body.amount);
        if (!Number.isFinite(amount) || amount <= 0 || amount >= 1e8) throw ApiError.badRequest("amount must be a positive number");
        data.amount = Math.round(amount * 100) / 100;
    }
    if (body.featuredDays !== undefined) data.featuredDays = intField(body.featuredDays, "featuredDays", { max: 3650 });
    for (const key of ["hasAnalytics", "hasSupport", "isActive"]) {
        if (body[key] !== undefined) data[key] = parseBool(body[key]);
    }
    return data;
};

// POST /packages (package:create)
export const createPackage = asyncHandler(async (req, res) => {
    const data = await parsePackageBody(req.body);
    const pkg = await prisma.package.create({ data, select: packageSelect });
    return apiResponse(res, 201, true, "Package created", pkg);
});

// PATCH /packages/:id (package:update). Existing orders keep their snapshot price, carts see the new price.
export const updatePackage = asyncHandler(async (req, res) => {
    const id = intField(req.params.id, "id", { min: 1 });
    const data = await parsePackageBody(req.body, { partial: true });
    if (!Object.keys(data).length) throw ApiError.badRequest("Nothing to update");

    const result = await prisma.package.updateMany({ where: { id }, data });
    if (!result.count) throw ApiError.notFound("Package not found");
    return apiResponse(res, 200, true, "Package updated", await prisma.package.findUnique({ where: { id }, select: packageSelect }));
});

// DELETE /packages/:id (package:delete) — packages that were ever ordered are kept for the records
export const deletePackage = asyncHandler(async (req, res) => {
    const id = intField(req.params.id, "id", { min: 1 });
    if (!(await prisma.package.findUnique({ where: { id }, select: { id: true } }))) throw ApiError.notFound("Package not found");
    if (await prisma.orderItem.count({ where: { packageId: id } })) throw ApiError.conflict("This package has orders. Deactivate it instead");

    await prisma.$transaction([prisma.cartItem.deleteMany({ where: { packageId: id } }), prisma.package.delete({ where: { id } })]);
    return apiResponse(res, 200, true, "Package deleted");
});
