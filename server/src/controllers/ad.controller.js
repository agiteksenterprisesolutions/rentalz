import prisma from "../config/prisma.js";
import { AdEventType, AdStatus, AdType, OperatorOption, UserRole } from "../generated/prisma/enums.ts";
import { adCardSelect, buildAdFilters, featuredNowWhere, getSort, parseBool, publicAdWhere } from "../services/ad-search.service.js";
import { approveAdById, rejectAdById, setFeatured } from "../services/ad-moderation.service.js";
import { audit } from "../services/audit.service.js";
import { deleteImage, uploadImages } from "../services/storage.service.js";
import { apiResponse, asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/error.js";
import { generateUniqueSlug } from "../utils/helper.js";
import { getPagination, paginated } from "../utils/pagination.js";
import { serializeAd, serializePhoto } from "../utils/serializers.js";

const MAX_PHOTOS = 15;
const STAFF_ROLES = [UserRole.ADMIN, UserRole.MODERATOR];

const detailInclude = {
    photos: { orderBy: { position: "asc" } },
    city: { select: { id: true, name: true, slug: true } },
    make: { select: { id: true, name: true } },
    mainCategory: { select: { id: true, title: true, slug: true } },
    subCategory: { select: { id: true, title: true, slug: true } },
    leafCategory: { select: { id: true, title: true, slug: true } },
    user: { select: { id: true, name: true, createdAt: true } },
};

// ── input parsing ────────────────────────────────────────────
const intOrNull = (value, name) => {
    if (value === undefined || value === null || value === "") return null;
    const n = Number.parseInt(value, 10);
    if (!Number.isInteger(n)) throw ApiError.badRequest(`${name} must be a number`);
    return n;
};

const moneyOrNull = (value, name) => {
    if (value === undefined || value === null || value === "") return null;
    const n = Number(value);
    if (!Number.isFinite(n) || n <= 0 || n >= 1e10) throw ApiError.badRequest(`${name} must be a positive amount`);
    return Math.round(n * 100) / 100;
};

const coordOrNull = (value, name, limit) => {
    if (value === undefined || value === null || value === "") return null;
    const n = Number(value);
    if (!Number.isFinite(n) || Math.abs(n) > limit) throw ApiError.badRequest(`${name} is out of range`);
    return n;
};

const textOrNull = (value, max) => {
    if (value === undefined || value === null) return null;
    const s = String(value).trim();
    return s ? s.slice(0, max) : null;
};

const boolOrNull = (value) => (value === undefined || value === null || value === "" ? null : parseBool(value));

// Category ids must exist and form a chain main -> sub -> leaf.
const resolveCategories = async ({ mainCategoryId, subCategoryId, leafCategoryId }) => {
    const ids = [mainCategoryId, subCategoryId, leafCategoryId].filter(Boolean);
    if (!mainCategoryId) throw ApiError.badRequest("mainCategoryId is required");
    if (leafCategoryId && !subCategoryId) throw ApiError.badRequest("subCategoryId is required with leafCategoryId");

    const found = await prisma.category.findMany({ where: { id: { in: ids }, isActive: true } });
    const byId = new Map(found.map((c) => [c.id, c]));
    if (byId.size !== ids.length) throw ApiError.badRequest("Unknown or inactive category");

    if (byId.get(mainCategoryId).level !== 1) throw ApiError.badRequest("mainCategoryId must be a top-level category");
    if (subCategoryId && byId.get(subCategoryId).parentId !== mainCategoryId) throw ApiError.badRequest("subCategoryId does not belong to the main category");
    if (leafCategoryId && byId.get(leafCategoryId).parentId !== subCategoryId) throw ApiError.badRequest("leafCategoryId does not belong to the sub category");
};

const assertExists = async (model, id, label) => {
    if (id && !(await model.findUnique({ where: { id }, select: { id: true } }))) throw ApiError.badRequest(`Unknown ${label}`);
};

// Builds the writable columns from a request body. Prices are validated here and `price`
// (the sort/filter column) is always computed server-side as the lowest entered price.
const parseAdBody = async (body, { partial = false } = {}) => {
    const has = (key) => !partial || body[key] !== undefined;
    const data = {};

    if (has("type")) {
        const type = String(body.type ?? "").toUpperCase();
        if (!Object.values(AdType).includes(type)) throw ApiError.badRequest("Invalid ad type");
        data.type = type;
    }
    if (has("title")) {
        const title = textOrNull(body.title, 255);
        if (!title || title.length < 5) throw ApiError.badRequest("Title must be at least 5 characters");
        data.title = title;
    }
    if (has("description")) data.description = textOrNull(body.description, 10000);
    if (has("phone")) {
        const phone = textOrNull(body.phone, 20);
        if (phone && !/^\+?[0-9\s-]{6,20}$/.test(phone)) throw ApiError.badRequest("Invalid phone number");
        data.phone = phone;
    }

    if (["mainCategoryId", "subCategoryId", "leafCategoryId"].some((k) => body[k] !== undefined) || !partial) {
        const cats = {
            mainCategoryId: intOrNull(body.mainCategoryId, "mainCategoryId"),
            subCategoryId: intOrNull(body.subCategoryId, "subCategoryId"),
            leafCategoryId: intOrNull(body.leafCategoryId, "leafCategoryId"),
        };
        await resolveCategories(cats);
        Object.assign(data, cats);
    }
    if (has("cityId")) {
        data.cityId = intOrNull(body.cityId, "cityId");
        if (!data.cityId && !partial) throw ApiError.badRequest("cityId is required");
        await assertExists(prisma.city, data.cityId, "city");
    }
    if (body.makeId !== undefined) {
        data.makeId = intOrNull(body.makeId, "makeId");
        await assertExists(prisma.make, data.makeId, "make");
    }

    if (body.model !== undefined) data.model = textOrNull(body.model, 100);
    if (body.modelYear !== undefined) {
        data.modelYear = intOrNull(body.modelYear, "modelYear");
        if (data.modelYear !== null && (data.modelYear < 1950 || data.modelYear > new Date().getFullYear() + 1)) throw ApiError.badRequest("modelYear is out of range");
    }
    if (body.capacity !== undefined) data.capacity = textOrNull(body.capacity, 100);
    if (body.operator !== undefined) {
        const operator = body.operator === "" || body.operator === null ? null : String(body.operator).toUpperCase();
        if (operator && !Object.values(OperatorOption).includes(operator)) throw ApiError.badRequest("Invalid operator option");
        data.operator = operator;
    }
    if (body.insurance !== undefined) data.insurance = boolOrNull(body.insurance);
    if (body.warranty !== undefined) data.warranty = boolOrNull(body.warranty);
    if (body.transportation !== undefined) data.transportation = boolOrNull(body.transportation);
    if (body.fuelType !== undefined) data.fuelType = textOrNull(body.fuelType, 50);
    if (body.terms !== undefined) data.terms = textOrNull(body.terms, 5000);
    if (body.address !== undefined) data.address = textOrNull(body.address, 255);
    if (body.latitude !== undefined) data.latitude = coordOrNull(body.latitude, "latitude", 90);
    if (body.longitude !== undefined) data.longitude = coordOrNull(body.longitude, "longitude", 180);

    const priceFields = ["price", "dailyPrice", "weeklyPrice", "monthlyPrice"];
    if (!partial || priceFields.some((k) => body[k] !== undefined)) {
        for (const key of priceFields) data[key] = moneyOrNull(body[key], key);
    }
    return data;
};

// Lowest entered price wins; used for sorting and range filters.
const withComputedPrice = (data, existing = {}) => {
    const merged = { ...existing, ...data };
    const prices = [merged.price, merged.dailyPrice, merged.weeklyPrice, merged.monthlyPrice].filter((p) => p !== null && p !== undefined).map(Number);
    if (!prices.length) throw ApiError.badRequest("Enter at least one price");
    return { ...data, price: Math.min(...prices) };
};

// ── public ───────────────────────────────────────────────────
// GET /ads — listing + search. Filters: q, type, city, category (id|slug), make, operator, insurance,
// warranty, fuelType, minPrice, maxPrice, minYear, maxYear, featured, sort, page, limit
export const searchAds = asyncHandler(async (req, res) => {
    const pagination = getPagination(req.query, { defaultLimit: 10, maxLimit: 50 });
    const where = await buildAdFilters(req.query, publicAdWhere());

    const [items, total] = await Promise.all([
        prisma.ad.findMany({ where, select: adCardSelect, orderBy: getSort(req.query.sort), skip: pagination.skip, take: pagination.take }),
        prisma.ad.count({ where }),
    ]);
    return apiResponse(res, 200, true, "Ads", paginated(items.map(serializeAd), total, pagination));
});

// GET /ads/featured — home page carousel, ordered by priority (lower first)
export const featuredAds = asyncHandler(async (req, res) => {
    const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 12, 1), 30);
    const items = await prisma.ad.findMany({
        where: { AND: [publicAdWhere(), featuredNowWhere()] },
        select: adCardSelect,
        orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
        take: limit,
    });
    return apiResponse(res, 200, true, "Featured ads", items.map(serializeAd));
});

// GET /ads/:slug — detail page. Owners and staff can also open their non-public ads.
export const getAd = asyncHandler(async (req, res) => {
    const ad = await prisma.ad.findFirst({ where: { slug: req.params.slug, deletedAt: null }, include: detailInclude });
    if (!ad) throw ApiError.notFound("Ad not found");

    const isOwner = req.user?.id === ad.userId;
    const isStaff = req.user && STAFF_ROLES.includes(req.user.role);
    const isPublic = ad.status === AdStatus.APPROVED && (!ad.expiresAt || ad.expiresAt > new Date());
    if (!isPublic && !isOwner && !isStaff) throw ApiError.notFound("Ad not found");

    // Count a view only for real visitors (not the seller or moderators) and never block the response on it.
    if (isPublic && !isOwner && !isStaff) {
        prisma.adEvent.create({ data: { adId: ad.id, userId: req.user?.id ?? null, type: AdEventType.VIEW } }).catch(() => {});
    }
    return apiResponse(res, 200, true, "Ad", serializeAd(ad));
});

// POST /ads/:id/click  { type: "PHONE" | "WHATSAPP" }
export const trackContactClick = asyncHandler(async (req, res) => {
    const types = { PHONE: AdEventType.PHONE_CLICK, WHATSAPP: AdEventType.WHATSAPP_CLICK };
    const type = types[String(req.body?.type ?? "").toUpperCase()];
    if (!type) throw ApiError.badRequest("type must be PHONE or WHATSAPP");

    const ad = await prisma.ad.findFirst({ where: { id: req.params.id, ...publicAdWhere() }, select: { id: true } });
    if (!ad) throw ApiError.notFound("Ad not found");

    await prisma.adEvent.create({ data: { adId: ad.id, userId: req.user?.id ?? null, type } });
    return apiResponse(res, 201, true, "Recorded");
});

// ── seller ───────────────────────────────────────────────────
// GET /ads/mine?status=&page=&limit=
export const myAds = asyncHandler(async (req, res) => {
    const pagination = getPagination(req.query);
    const where = { userId: req.user.id, deletedAt: null };
    if (req.query.status) {
        const status = String(req.query.status).toUpperCase();
        if (!Object.values(AdStatus).includes(status)) throw ApiError.badRequest("Invalid status");
        where.status = status;
    }
    const [items, total] = await Promise.all([
        prisma.ad.findMany({ where, select: { ...adCardSelect, moderationNote: true }, orderBy: { createdAt: "desc" }, skip: pagination.skip, take: pagination.take }),
        prisma.ad.count({ where }),
    ]);
    return apiResponse(res, 200, true, "My ads", paginated(items.map(serializeAd), total, pagination));
});

// POST /ads (multipart: fields + up to 15 `photos`). New ads always start as PENDING.
export const createAd = asyncHandler(async (req, res) => {
    const files = req.files ?? [];
    const data = withComputedPrice(await parseAdBody(req.body));

    const uploaded = await uploadImages(files, "ads");
    try {
        const ad = await prisma.ad.create({
            data: {
                ...data,
                slug: await generateUniqueSlug(data.title, prisma.ad),
                userId: req.user.id,
                creatorId: req.user.id,
                status: AdStatus.PENDING,
                photos: { create: uploaded.map((p, position) => ({ key: p.key, position })) },
            },
            include: detailInclude,
        });
        return apiResponse(res, 201, true, "Ad submitted for review", serializeAd(ad));
    } catch (error) {
        await Promise.all(uploaded.map((p) => deleteImage(p.key)));
        throw error;
    }
});

// PATCH /ads/:id — owner or ad:update. An owner editing a live ad sends it back for review.
export const updateAd = asyncHandler(async (req, res) => {
    const existing = await prisma.ad.findFirst({ where: { id: req.params.id, deletedAt: null } });
    if (!existing) throw ApiError.notFound("Ad not found");

    const data = await parseAdBody(req.body, { partial: true });
    if (!Object.keys(data).length) throw ApiError.badRequest("Nothing to update");
    Object.assign(data, withComputedPrice(data, existing));

    const isStaffEdit = req.permissions?.has("ad:update");
    if (!isStaffEdit && [AdStatus.APPROVED, AdStatus.REJECTED, AdStatus.EXPIRED].includes(existing.status)) {
        data.status = AdStatus.PENDING;
        data.moderationNote = null;
    }

    const ad = await prisma.ad.update({ where: { id: existing.id }, data, include: detailInclude });
    return apiResponse(res, 200, true, "Ad updated", serializeAd(ad));
});

// DELETE /ads/:id — soft delete (owner or ad:delete)
export const deleteAd = asyncHandler(async (req, res) => {
    const result = await prisma.ad.updateMany({ where: { id: req.params.id, deletedAt: null }, data: { deletedAt: new Date() } });
    if (!result.count) throw ApiError.notFound("Ad not found");
    return apiResponse(res, 200, true, "Ad deleted");
});

// POST /ads/:id/photos (multipart `photos`)
export const addPhotos = asyncHandler(async (req, res) => {
    const files = req.files ?? [];
    if (!files.length) throw ApiError.badRequest("No photos uploaded");

    const ad = await prisma.ad.findFirst({ where: { id: req.params.id, deletedAt: null }, select: { id: true, _count: { select: { photos: true } } } });
    if (!ad) throw ApiError.notFound("Ad not found");
    if (ad._count.photos + files.length > MAX_PHOTOS) throw ApiError.badRequest(`An ad can have at most ${MAX_PHOTOS} photos`);

    const uploaded = await uploadImages(files, "ads");
    try {
        await prisma.adPhoto.createMany({ data: uploaded.map((p, i) => ({ adId: ad.id, key: p.key, position: ad._count.photos + i })) });
    } catch (error) {
        await Promise.all(uploaded.map((p) => deleteImage(p.key)));
        throw error;
    }
    const photos = await prisma.adPhoto.findMany({ where: { adId: ad.id }, orderBy: { position: "asc" } });
    return apiResponse(res, 201, true, "Photos added", photos.map(serializePhoto));
});

// DELETE /ads/:id/photos/:photoId
export const removePhoto = asyncHandler(async (req, res) => {
    const photo = await prisma.adPhoto.findFirst({ where: { id: req.params.photoId, adId: req.params.id } });
    if (!photo) throw ApiError.notFound("Photo not found");

    await prisma.adPhoto.delete({ where: { id: photo.id } });
    await deleteImage(photo.key);
    return apiResponse(res, 200, true, "Photo removed");
});

// ── moderation ───────────────────────────────────────────────
// GET /ads/manage?status=&type=&q=&userId= — every ad, any status (ad:list)
export const manageAds = asyncHandler(async (req, res) => {
    const pagination = getPagination(req.query, { defaultLimit: 20 });
    const filters = await buildAdFilters(req.query, { deletedAt: null });
    if (req.query.status) {
        const status = String(req.query.status).toUpperCase();
        if (!Object.values(AdStatus).includes(status)) throw ApiError.badRequest("Invalid status");
        filters.AND.push({ status });
    }
    if (req.query.userId) filters.AND.push({ userId: String(req.query.userId) });

    const [items, total] = await Promise.all([
        prisma.ad.findMany({
            where: filters,
            select: { ...adCardSelect, user: { select: { id: true, name: true, email: true } } },
            orderBy: getSort(req.query.sort),
            skip: pagination.skip,
            take: pagination.take,
        }),
        prisma.ad.count({ where: filters }),
    ]);
    return apiResponse(res, 200, true, "Ads", paginated(items.map(serializeAd), total, pagination));
});

// POST /ads/:id/approve — a first publication or renewal spends one of the owner's ad credits (see ad-moderation.service)
export const approveAd = asyncHandler(async (req, res) => {
    const updated = await approveAdById(req.params.id);
    await audit(req, "ad:approve", "Ad", req.params.id);
    return apiResponse(res, 200, true, "Ad approved", updated);
});

export const parseRejectReason = (body) => {
    const reason = textOrNull(body?.reason, 500);
    if (!reason) throw ApiError.badRequest("A rejection reason is required");
    return reason;
};

// POST /ads/:id/reject  { reason }
export const rejectAd = asyncHandler(async (req, res) => {
    const reason = parseRejectReason(req.body);
    const updated = await rejectAdById(req.params.id, reason);
    await audit(req, "ad:reject", "Ad", req.params.id, { reason });
    return apiResponse(res, 200, true, "Ad rejected", updated);
});

export const parseFeatureBody = (body) => {
    const input = {};
    if (body?.isFeatured !== undefined) input.isFeatured = parseBool(body.isFeatured);
    if (body?.priority !== undefined) {
        input.priority = intOrNull(body.priority, "priority") ?? 0;
        if (input.priority < 0 || input.priority > 9999) throw ApiError.badRequest("priority must be between 0 and 9999");
    }
    if (body?.days !== undefined && body.days !== "") {
        input.days = intOrNull(body.days, "days");
        if (input.days < 1 || input.days > 3650) throw ApiError.badRequest("days must be between 1 and 3650");
    }
    if (input.isFeatured === undefined && input.priority === undefined) throw ApiError.badRequest("Provide isFeatured and/or priority");
    return input;
};

// POST /ads/:id/feature  { isFeatured, priority, days? } — without `days` the ad stays featured until removed
export const featureAd = asyncHandler(async (req, res) => {
    const input = parseFeatureBody(req.body);
    const result = await setFeatured({ id: req.params.id }, input);
    if (!result.count) throw ApiError.notFound("Ad not found");
    await audit(req, input.isFeatured === false ? "ad:unfeature" : "ad:feature", "Ad", req.params.id, input);
    return apiResponse(res, 200, true, "Ad updated", input);
});

// POST /ads/:id/assign  { userId } — the original creator is kept in `creatorId`
export const assignAd = asyncHandler(async (req, res) => {
    const userId = String(req.body?.userId ?? "");
    if (!userId) throw ApiError.badRequest("userId is required");
    if (!(await prisma.user.findFirst({ where: { id: userId, deletedAt: null }, select: { id: true } }))) throw ApiError.badRequest("Unknown user");

    const result = await prisma.ad.updateMany({ where: { id: req.params.id, deletedAt: null }, data: { userId } });
    if (!result.count) throw ApiError.notFound("Ad not found");
    await audit(req, "ad:assign", "Ad", req.params.id, { userId });
    return apiResponse(res, 200, true, "Ad reassigned", { userId });
});
