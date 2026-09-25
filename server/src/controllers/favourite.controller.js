import prisma from "../config/prisma.js";
import { adCardSelect, publicAdWhere } from "../services/ad-search.service.js";
import { apiResponse, asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/error.js";
import { getPagination, paginated } from "../utils/pagination.js";
import { serializeAd } from "../utils/serializers.js";

const MAX_FAVOURITES = 500;

// GET /favourites — the user's saved ads that are still publicly visible, newest first
export const listFavourites = asyncHandler(async (req, res) => {
    const pagination = getPagination(req.query);
    const where = { userId: req.user.id, ad: publicAdWhere() };

    const [rows, total] = await Promise.all([
        prisma.favourite.findMany({
            where,
            select: { createdAt: true, ad: { select: adCardSelect } },
            orderBy: { createdAt: "desc" },
            skip: pagination.skip,
            take: pagination.take,
        }),
        prisma.favourite.count({ where }),
    ]);
    const items = rows.map(({ ad, createdAt }) => ({ ...serializeAd(ad), favouritedAt: createdAt }));
    return apiResponse(res, 200, true, "Favourites", paginated(items, total, pagination));
});

// GET /favourites/ids — every favourited ad id, so list pages can render the heart state in one request
export const favouriteIds = asyncHandler(async (req, res) => {
    const rows = await prisma.favourite.findMany({ where: { userId: req.user.id }, select: { adId: true } });
    return apiResponse(res, 200, true, "Favourite ids", rows.map((r) => r.adId));
});

// POST /favourites/:adId — idempotent
export const addFavourite = asyncHandler(async (req, res) => {
    const ad = await prisma.ad.findFirst({ where: { id: req.params.adId, ...publicAdWhere() }, select: { id: true } });
    if (!ad) throw ApiError.notFound("Ad not found");

    const already = await prisma.favourite.findUnique({ where: { userId_adId: { userId: req.user.id, adId: ad.id } } });
    if (!already) {
        if ((await prisma.favourite.count({ where: { userId: req.user.id } })) >= MAX_FAVOURITES) {
            throw ApiError.badRequest(`You can save up to ${MAX_FAVOURITES} favourites`);
        }
        await prisma.favourite.create({ data: { userId: req.user.id, adId: ad.id } }).catch((e) => {
            if (e.code !== "P2002") throw e; // a parallel request already saved it
        });
    }
    return apiResponse(res, 201, true, "Added to favourites");
});

// DELETE /favourites/:adId — idempotent
export const removeFavourite = asyncHandler(async (req, res) => {
    await prisma.favourite.deleteMany({ where: { userId: req.user.id, adId: req.params.adId } });
    return apiResponse(res, 200, true, "Removed from favourites");
});
