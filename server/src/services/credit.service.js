import prisma from "../config/prisma.js";
import { CreditSource } from "../generated/prisma/enums.ts";

/** Credits a user can still spend (sum of unused credits across their lots). */
export const getAdCredits = async (userId, db = prisma) => {
    const { _sum } = await db.adCreditLot.aggregate({ where: { userId }, _sum: { remaining: true } });
    return _sum.remaining ?? 0;
};

export const grantCredits = (db, { userId, credits, source, orderItemId = null, featuredDays = 0, durationDays = 30 }) =>
    db.adCreditLot.create({
        data: { userId, source, orderItemId, granted: credits, remaining: credits, featuredDays, durationDays },
    });

/**
 * Spends one credit from the oldest lot that still has credits. The conditional update means two
 * simultaneous approvals can never spend the same credit. Returns the lot's terms, or null if none is left.
 */
export const consumeCredit = async (db, userId) => {
    for (let attempt = 0; attempt < 3; attempt++) {
        const lot = await db.adCreditLot.findFirst({
            where: { userId, remaining: { gt: 0 } },
            orderBy: { createdAt: "asc" },
            select: { id: true, featuredDays: true, durationDays: true },
        });
        if (!lot) return null;

        const spent = await db.adCreditLot.updateMany({ where: { id: lot.id, remaining: { gt: 0 } }, data: { remaining: { decrement: 1 } } });
        if (spent.count) return lot;
    }
    return null;
};

export { CreditSource };
