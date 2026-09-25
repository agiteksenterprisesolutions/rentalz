import prisma from "../config/prisma.js";
import { apiResponse, asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/error.js";
import { generateUniqueSlug } from "../utils/helper.js";
import { audit } from "../services/audit.service.js";
import { revalidateFrontend } from "../services/revalidate.service.js";

// Small, rarely-changing lookup lists used by the search filters and the post-ad form.
// `no-cache` lets browsers and proxies keep a copy but check it (a cheap 304) before every use, so an admin edit
// is never hidden behind a stale copy. The Next.js frontend is refreshed by revalidateFrontend() after each edit.
const cacheHeader = (req, res) => res.set("Cache-Control", "public, no-cache");

export const listCities = asyncHandler(async (req, res) => {
    const cities = await prisma.city.findMany({ orderBy: { name: "asc" } });
    cacheHeader(req, res);
    return apiResponse(res, 200, true, "Cities", cities);
});

export const listMakes = asyncHandler(async (req, res) => {
    const makes = await prisma.make.findMany({ orderBy: { name: "asc" } });
    cacheHeader(req, res);
    return apiResponse(res, 200, true, "Makes", makes);
});

const cleanName = (body) => {
    const name = String(body?.name ?? "").trim().replace(/\s+/g, " ");
    if (!name || name.length > 100) throw ApiError.badRequest("Name is required (max 100 characters)");
    return name;
};

const parseId = (value) => {
    const id = Number.parseInt(value, 10);
    if (!Number.isInteger(id) || id < 1) throw ApiError.badRequest("Invalid id");
    return id;
};

// POST /catalog/cities { name } (city:manage)
export const createCity = asyncHandler(async (req, res) => {
    const name = cleanName(req.body);
    const city = await prisma.city.create({ data: { name, slug: await generateUniqueSlug(name, prisma.city) } });
    revalidateFrontend("cities");
    await audit(req, "city:create", "City", String(city.id), { name });
    return apiResponse(res, 201, true, "City created", city);
});

// PATCH /catalog/cities/:id { name }. The slug follows the name; old URLs are not kept.
export const updateCity = asyncHandler(async (req, res) => {
    const id = parseId(req.params.id);
    const name = cleanName(req.body);
    if (!(await prisma.city.findUnique({ where: { id }, select: { id: true } }))) throw ApiError.notFound("City not found");
    const city = await prisma.city.update({ where: { id }, data: { name, slug: await generateUniqueSlug(name, prisma.city, id) } });
    revalidateFrontend("cities");
    await audit(req, "city:update", "City", String(id), { name });
    return apiResponse(res, 200, true, "City updated", city);
});

// DELETE /catalog/cities/:id. Refused while ads use it
export const deleteCity = asyncHandler(async (req, res) => {
    const id = parseId(req.params.id);
    if (!(await prisma.city.findUnique({ where: { id }, select: { id: true } }))) throw ApiError.notFound("City not found");
    if (await prisma.ad.count({ where: { cityId: id } })) throw ApiError.conflict("Ads still use this city, so it can't be deleted");
    await prisma.city.delete({ where: { id } });
    revalidateFrontend("cities");
    await audit(req, "city:delete", "City", String(id));
    return apiResponse(res, 200, true, "City deleted");
});

// POST /catalog/makes { name } (make:manage)
export const createMake = asyncHandler(async (req, res) => {
    const name = cleanName(req.body);
    const make = await prisma.make.create({ data: { name } });
    revalidateFrontend("makes");
    await audit(req, "make:create", "Make", String(make.id), { name });
    return apiResponse(res, 201, true, "Make created", make);
});

export const updateMake = asyncHandler(async (req, res) => {
    const id = parseId(req.params.id);
    const name = cleanName(req.body);
    if (!(await prisma.make.findUnique({ where: { id }, select: { id: true } }))) throw ApiError.notFound("Make not found");
    const make = await prisma.make.update({ where: { id }, data: { name } });
    revalidateFrontend("makes");
    await audit(req, "make:update", "Make", String(id), { name });
    return apiResponse(res, 200, true, "Make updated", make);
});

export const deleteMake = asyncHandler(async (req, res) => {
    const id = parseId(req.params.id);
    if (!(await prisma.make.findUnique({ where: { id }, select: { id: true } }))) throw ApiError.notFound("Make not found");
    if (await prisma.ad.count({ where: { makeId: id } })) throw ApiError.conflict("Ads still use this make, so it can't be deleted");
    await prisma.make.delete({ where: { id } });
    revalidateFrontend("makes");
    await audit(req, "make:delete", "Make", String(id));
    return apiResponse(res, 200, true, "Make deleted");
});
