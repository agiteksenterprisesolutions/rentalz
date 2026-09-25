import prisma from "../config/prisma.js";
import { AdStatus } from "../generated/prisma/enums.ts";
import { consumeCredit } from "./credit.service.js";
import { sendAdApprovedEmail, sendAdRejectedEmail } from "./email.service.js";
import { ApiError } from "../utils/error.js";

const DAY_MS = 86400000;
const PURCHASED_FEATURE_PRIORITY = 100; // after anything an admin curated by hand (lower = first)

/**
 * Approves an ad. A first publication, or renewing an ad whose window has ended, spends one credit; the credit's lot
 * sets how long the ad runs and how many days it is featured. Re-approving after an edit costs nothing.
 */
export const approveAdById = async (adId) => {
    const ad = await prisma.ad.findFirst({ where: { id: adId, deletedAt: null }, include: { user: true } });
    if (!ad) throw ApiError.notFound("Ad not found");
    if (ad.status === AdStatus.APPROVED) throw ApiError.conflict("Ad is already approved");

    const now = new Date();
    const needsCredit = !ad.publishedAt || ad.status === AdStatus.EXPIRED || (ad.expiresAt && ad.expiresAt <= now);

    const updated = await prisma.$transaction(async (tx) => {
        const data = { status: AdStatus.APPROVED, moderationNote: null };
        if (needsCredit) {
            const lot = await consumeCredit(tx, ad.userId);
            if (!lot) throw ApiError.badRequest("The owner has no ad credits left");

            data.publishedAt = now;
            data.expiresAt = new Date(now.getTime() + lot.durationDays * DAY_MS);
            if (lot.featuredDays > 0) {
                data.isFeatured = true;
                data.featuredUntil = new Date(now.getTime() + lot.featuredDays * DAY_MS);
                data.priority = ad.priority || PURCHASED_FEATURE_PRIORITY;
            }
        }
        return tx.ad.update({
            where: { id: ad.id },
            data,
            select: { id: true, slug: true, title: true, status: true, publishedAt: true, expiresAt: true, isFeatured: true, featuredUntil: true },
        });
    });

    sendAdApprovedEmail(ad.user, updated).catch((e) => console.error(`Approval email failed: ${e.message}`));
    return updated;
};

export const rejectAdById = async (adId, reason) => {
    const ad = await prisma.ad.findFirst({ where: { id: adId, deletedAt: null }, include: { user: true } });
    if (!ad) throw ApiError.notFound("Ad not found");

    const updated = await prisma.ad.update({
        where: { id: ad.id },
        data: { status: AdStatus.REJECTED, moderationNote: reason },
        select: { id: true, slug: true, title: true, status: true, moderationNote: true },
    });
    sendAdRejectedEmail(ad.user, updated, reason).catch((e) => console.error(`Rejection email failed: ${e.message}`));
    return updated;
};

/** Admin featuring. `days` gives the feature an end date; without it the ad stays featured until removed. */
export const setFeatured = async (where, { isFeatured, priority, days }) => {
    const data = {};
    if (isFeatured !== undefined) {
        data.isFeatured = isFeatured;
        data.featuredUntil = isFeatured && days ? new Date(Date.now() + days * DAY_MS) : null;
    }
    if (priority !== undefined) data.priority = priority;
    return prisma.ad.updateMany({ where: { ...where, deletedAt: null }, data });
};
