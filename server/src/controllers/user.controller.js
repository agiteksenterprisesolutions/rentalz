import prisma from "../config/prisma.js";
import { AdEventType, AdStatus, UserStatus } from "../generated/prisma/enums.ts";
import { getAdCredits } from "../services/credit.service.js";
import { deleteImage, publicUrl, uploadImage } from "../services/storage.service.js";
import { apiResponse, asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/error.js";
import { clearAuthCookies, comparePassword, hashToken } from "../utils/helper.js";
import { randomBytes } from "crypto";
import { sendEmailChangeLink, sendEmailChangeNotice } from "../services/email.service.js";
import { publicAdWhere } from "../services/ad-search.service.js";

const DAY_MS = 86400000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EMAIL_CHANGE_EXPIRY_MINUTES = 30;
const EMAIL_CHANGE_COOLDOWN_MS = 2 * 60 * 1000;
const GENDERS = ["male", "female", "other"];

const profileSelect = { firstName: true, lastName: true, aboutMe: true, organizationName: true, birthday: true, gender: true, avatarKey: true };

const serializeAccount = ({ profile, emailChange, ...user }, adCredits) => {
    const { avatarKey, ...rest } = profile ?? {};
    const pendingEmail = emailChange && emailChange.expiresAt > new Date() ? emailChange : null;
    return { ...user, adCredits, pendingEmail, profile: { ...rest, avatarUrl: publicUrl(avatarKey) } };
};

const loadAccount = async (userId) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true, phone: true, role: true, status: true, emailVerified: true, createdAt: true, profile: { select: profileSelect }, emailChange: { select: { newEmail: true, expiresAt: true } } },
    });
    return serializeAccount(user, await getAdCredits(userId));
};

const text = (value, max, name) => {
    if (value === null || value === "") return null;
    if (typeof value !== "string") throw ApiError.badRequest(`${name} must be text`);
    const trimmed = value.trim();
    if (trimmed.length > max) throw ApiError.badRequest(`${name} must be at most ${max} characters`);
    return trimmed || null;
};

// GET /users/me — account, profile (with avatar URL) and ad-credit balance
export const getMe = asyncHandler(async (req, res) => apiResponse(res, 200, true, "Account", await loadAccount(req.user.id)));

// PATCH /users/me — name, phone and profile fields. Email and password have their own flows.
export const updateMe = asyncHandler(async (req, res) => {
    const body = req.body ?? {};
    const userData = {};
    const profileData = {};

    if (body.name !== undefined) {
        const name = text(body.name, 191, "name");
        if (!name) throw ApiError.badRequest("Name cannot be empty");
        userData.name = name;
    }
    if (body.phone !== undefined) {
        const phone = text(body.phone, 20, "phone");
        if (phone && !/^\+?[0-9\s-]{6,20}$/.test(phone)) throw ApiError.badRequest("Invalid phone number");
        userData.phone = phone;
    }
    if (body.firstName !== undefined) profileData.firstName = text(body.firstName, 191, "firstName");
    if (body.lastName !== undefined) profileData.lastName = text(body.lastName, 191, "lastName");
    if (body.aboutMe !== undefined) profileData.aboutMe = text(body.aboutMe, 2000, "aboutMe");
    if (body.organizationName !== undefined) profileData.organizationName = text(body.organizationName, 191, "organizationName");
    if (body.gender !== undefined) {
        const gender = text(body.gender, 20, "gender")?.toLowerCase() ?? null;
        if (gender && !GENDERS.includes(gender)) throw ApiError.badRequest(`gender must be one of: ${GENDERS.join(", ")}`);
        profileData.gender = gender;
    }
    if (body.birthday !== undefined) {
        const raw = text(body.birthday, 10, "birthday");
        const date = raw ? new Date(`${raw}T00:00:00Z`) : null;
        if (raw && (!/^\d{4}-\d{2}-\d{2}$/.test(raw) || Number.isNaN(date.getTime()) || date > new Date() || date.getUTCFullYear() < 1900)) {
            throw ApiError.badRequest("birthday must be a past date like 1990-05-31");
        }
        profileData.birthday = date;
    }
    if (!Object.keys(userData).length && !Object.keys(profileData).length) throw ApiError.badRequest("Nothing to update");

    await prisma.$transaction([
        ...(Object.keys(userData).length ? [prisma.user.update({ where: { id: req.user.id }, data: userData })] : []),
        prisma.profile.upsert({ where: { userId: req.user.id }, update: profileData, create: { userId: req.user.id, ...profileData } }),
    ]);
    return apiResponse(res, 200, true, "Account updated", await loadAccount(req.user.id));
});

// PUT /users/me/avatar (multipart `avatar`) — replaces the previous picture
export const setAvatar = asyncHandler(async (req, res) => {
    if (!req.file) throw ApiError.badRequest("No image uploaded");

    const old = await prisma.profile.findUnique({ where: { userId: req.user.id }, select: { avatarKey: true } });
    const image = await uploadImage(req.file.buffer, "avatars");
    try {
        await prisma.profile.upsert({ where: { userId: req.user.id }, update: { avatarKey: image.key }, create: { userId: req.user.id, avatarKey: image.key } });
    } catch (error) {
        await deleteImage(image.key);
        throw error;
    }
    await deleteImage(old?.avatarKey);
    return apiResponse(res, 200, true, "Avatar updated", { avatarUrl: image.url });
});

// DELETE /users/me/avatar
export const removeAvatar = asyncHandler(async (req, res) => {
    const profile = await prisma.profile.findUnique({ where: { userId: req.user.id }, select: { avatarKey: true } });
    if (profile?.avatarKey) {
        await prisma.profile.update({ where: { userId: req.user.id }, data: { avatarKey: null } });
        await deleteImage(profile.avatarKey);
    }
    return apiResponse(res, 200, true, "Avatar removed");
});

// DELETE /users/me  { password }  (accounts without a password, e.g. Google sign-in, send { confirm: "DELETE" })
// The account is anonymised rather than erased: orders and the audit trail keep working, but the person's
// email, name, phone, profile and picture are gone, their ads leave the site and every session ends.
export const deleteMe = asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.user.id }, include: { profile: { select: { avatarKey: true } } } });

    if (user.passwordHash) {
        if (!req.body?.password || !(await comparePassword(String(req.body.password), user.passwordHash))) throw ApiError.unauthorized("Incorrect password");
    } else if (req.body?.confirm !== "DELETE") {
        throw ApiError.badRequest('Send { "confirm": "DELETE" } to delete this account');
    }

    const now = new Date();
    await prisma.$transaction([
        prisma.user.update({
            where: { id: user.id },
            data: {
                deletedAt: now,
                status: UserStatus.INACTIVE,
                name: "Deleted user",
                email: `deleted-${user.id}@deleted.invalid`,
                phone: null,
                passwordHash: null,
                provider: null,
                providerId: null,
                emailVerified: false,
                emailVerificationTokenHash: null,
                emailVerificationExpiry: null,
                passwordResetTokenHash: null,
                passwordResetExpiry: null,
            },
        }),
        prisma.profile.deleteMany({ where: { userId: user.id } }),
        prisma.refreshToken.deleteMany({ where: { userId: user.id } }),
        prisma.ad.updateMany({ where: { userId: user.id, deletedAt: null }, data: { deletedAt: now } }),
        prisma.favourite.deleteMany({ where: { userId: user.id } }),
        prisma.savedSearch.deleteMany({ where: { userId: user.id } }),
        prisma.cartItem.deleteMany({ where: { cartId: user.id } }),
        prisma.emailChangeRequest.deleteMany({ where: { userId: user.id } }),
    ]);
    await deleteImage(user.profile?.avatarKey);

    clearAuthCookies(res);
    return apiResponse(res, 200, true, "Your account has been deleted");
});

// GET /users/me/dashboard — the seller's overview: ads, credits, audience and best performers
export const getDashboard = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const now = new Date();
    const since30 = new Date(now.getTime() - 30 * DAY_MS);
    const since14 = new Date(now.getTime() - 14 * DAY_MS);
    const ownAds = { userId, deletedAt: null };
    const ownEvents = { ad: ownAds };

    const [byStatus, expiringSoon, favourites, events30, eventsAll, perAd, perDay, credits, lots] = await Promise.all([
        prisma.ad.groupBy({ by: ["status"], where: ownAds, _count: true }),
        prisma.ad.count({ where: { AND: [ownAds, publicAdWhere(), { expiresAt: { lte: new Date(now.getTime() + 7 * DAY_MS) } }] } }),
        prisma.favourite.count({ where: { ad: ownAds } }),
        prisma.adEvent.groupBy({ by: ["type"], where: { ...ownEvents, createdAt: { gte: since30 } }, _count: true }),
        prisma.adEvent.groupBy({ by: ["type"], where: ownEvents, _count: true }),
        prisma.adEvent.groupBy({ by: ["adId"], where: { ...ownEvents, type: AdEventType.VIEW, createdAt: { gte: since30 } }, _count: true, orderBy: { _count: { adId: "desc" } }, take: 5 }),
        prisma.$queryRaw`
            SELECT DATE(e.createdAt) AS day, COUNT(*) AS views
            FROM AdEvent e JOIN Ad a ON a.id = e.adId
            WHERE a.userId = ${userId} AND a.deletedAt IS NULL AND e.type = 'VIEW' AND e.createdAt >= ${since14}
            GROUP BY DATE(e.createdAt) ORDER BY day`,
        getAdCredits(userId),
        prisma.adCreditLot.findMany({ where: { userId, remaining: { gt: 0 } }, orderBy: { createdAt: "asc" }, select: { remaining: true, featuredDays: true, durationDays: true, createdAt: true } }),
    ]);

    const counts = (rows) => Object.fromEntries(Object.values(AdEventType).map((type) => [type, rows.find((r) => r.type === type)?._count ?? 0]));
    const titles = await prisma.ad.findMany({ where: { id: { in: perAd.map((r) => r.adId) } }, select: { id: true, slug: true, title: true } });
    const titleById = new Map(titles.map((a) => [a.id, a]));

    return apiResponse(res, 200, true, "Dashboard", {
        ads: {
            total: byStatus.reduce((n, r) => n + r._count, 0),
            ...Object.fromEntries(Object.values(AdStatus).map((s) => [s, byStatus.find((r) => r.status === s)?._count ?? 0])),
            expiringWithin7Days: expiringSoon,
        },
        credits: { available: credits, lots },
        audience: {
            favourites,
            last30Days: counts(events30),
            allTime: counts(eventsAll),
            viewsPerDay: perDay.map((r) => ({ day: new Date(r.day).toISOString().slice(0, 10), views: Number(r.views) })),
        },
        topAds: perAd.map((r) => ({ ...titleById.get(r.adId), views: r._count })),
    });
});

// POST /users/me/email  { newEmail, password } — starts an email change. Nothing changes until the NEW address
// confirms through the emailed link (POST /auth/confirm-email-change), which proves the person owns it.
export const requestEmailChange = asyncHandler(async (req, res) => {
    const newEmail = String(req.body?.newEmail ?? "").trim().toLowerCase();
    if (!EMAIL_RE.test(newEmail) || newEmail.length > 191) throw ApiError.badRequest("A valid email address is required");

    const user = await prisma.user.findUnique({ where: { id: req.user.id }, include: { emailChange: true } });
    if (newEmail === user.email) throw ApiError.badRequest("That is already your email address");

    // Sign-in is by password, so it doubles as the proof that the account owner (not a stolen session) is asking.
    if (!user.passwordHash) throw ApiError.badRequest("Set a password first (use Forgot password), then try again");
    if (!req.body?.password || !(await comparePassword(String(req.body.password), user.passwordHash))) throw ApiError.unauthorized("Incorrect password");

    if (await prisma.user.findUnique({ where: { email: newEmail }, select: { id: true } })) throw ApiError.conflict("That email address is already in use");
    if (user.emailChange && Date.now() - user.emailChange.createdAt.getTime() < EMAIL_CHANGE_COOLDOWN_MS) {
        throw new ApiError("Please wait a couple of minutes before requesting another change", 429);
    }

    const token = randomBytes(32).toString("hex");
    const data = { newEmail, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + EMAIL_CHANGE_EXPIRY_MINUTES * 60 * 1000), createdAt: new Date() };
    await prisma.emailChangeRequest.upsert({ where: { userId: user.id }, update: data, create: { userId: user.id, ...data } });

    try {
        await sendEmailChangeLink(user, newEmail, token, EMAIL_CHANGE_EXPIRY_MINUTES);
    } catch (error) {
        console.error(`Email change link to user ${user.id} failed: ${error.message}`);
        await prisma.emailChangeRequest.deleteMany({ where: { userId: user.id } });
        throw new ApiError("We couldn't send the confirmation email. Please try again in a few minutes.", 503);
    }
    sendEmailChangeNotice(user.email, user.name, newEmail, { changed: false }).catch((e) => console.error(`Email change notice failed: ${e.message}`));

    return apiResponse(res, 202, true, "We sent a confirmation link to your new address.", { newEmail, expiresInMinutes: EMAIL_CHANGE_EXPIRY_MINUTES });
});

// DELETE /users/me/email — cancel a pending change
export const cancelEmailChange = asyncHandler(async (req, res) => {
    await prisma.emailChangeRequest.deleteMany({ where: { userId: req.user.id } });
    return apiResponse(res, 200, true, "Email change cancelled");
});
