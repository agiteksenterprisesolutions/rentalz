import prisma from "../config/prisma.js";
import { UserStatus } from "../generated/prisma/enums.ts";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/error.js";
import { getSafeUser, verifyAccessToken } from "../utils/helper.js";

// Requires a valid access-token cookie and an active, verified account
export const verifyUser = asyncHandler(async (req, res, next) => {
    const token = req.cookies?.accessToken;
    if (!token) throw ApiError.unauthorized("Unauthorized");

    const decoded = verifyAccessToken(token);

    const user = await prisma.user.findFirst({
        where: {
            id: decoded.id,
            emailVerified: true,
            status: UserStatus.ACTIVE,
            deletedAt: null,
        },
    });

    if (!user) throw ApiError.unauthorized("Invalid or expired session");

    req.user = getSafeUser(user);
    next();
});

// Attaches req.user when a valid session exists, otherwise continues as guest.
// Use on public routes that behave differently for logged-in users (e.g. "is favourited").
export const optionalUser = asyncHandler(async (req, res, next) => {
    const token = req.cookies?.accessToken;
    if (!token) return next();

    try {
        const decoded = verifyAccessToken(token);
        const user = await prisma.user.findFirst({
            where: { id: decoded.id, emailVerified: true, status: UserStatus.ACTIVE, deletedAt: null },
        });
        if (user) req.user = getSafeUser(user);
    } catch {
        // invalid/expired token -> treat as guest
    }
    next();
});
