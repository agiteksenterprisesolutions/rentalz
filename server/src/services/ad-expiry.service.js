import prisma from "../config/prisma.js";
import { AdStatus } from "../generated/prisma/enums.ts";

const RUN_EVERY_MS = 60 * 60 * 1000; // hourly; public queries also hide expired ads, so this only keeps status accurate

/** Marks approved ads whose publishing window has ended as EXPIRED. Returns how many changed. */
export const expireAds = async () => {
    const { count } = await prisma.ad.updateMany({
        where: { status: AdStatus.APPROVED, expiresAt: { lte: new Date() } },
        data: { status: AdStatus.EXPIRED },
    });
    return count;
};

/** Ends featured windows that have run out. Returns how many ads were un-featured. */
export const endFeaturedWindows = async () => {
    const { count } = await prisma.ad.updateMany({
        where: { isFeatured: true, featuredUntil: { lte: new Date() } },
        data: { isFeatured: false, featuredUntil: null },
    });
    return count;
};

const runSafely = async () => {
    try {
        const expired = await expireAds();
        if (expired) console.log(`Expired ${expired} ad(s)`);
        const unfeatured = await endFeaturedWindows();
        if (unfeatured) console.log(`Ended the featured window of ${unfeatured} ad(s)`);
    } catch (error) {
        console.error(`Ad expiry run failed: ${error.message}`);
    }
};

export const startAdExpiryJob = () => {
    runSafely();
    setInterval(runSafely, RUN_EVERY_MS).unref();
};
