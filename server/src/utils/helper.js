import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { randomUUID } from "node:crypto";
import ms from "ms";
import slugify from "slugify";
import { createHash } from "crypto";
import { ApiError } from "./error.js";

// NOTE: secrets are read lazily (at call time) so dotenv/config has always run first.
const env = () => process.env;

export const JWT_EXPIRES_IN = () => env().JWT_EXPIRES_IN || "15m";
export const JWT_REFRESH_EXPIRES_IN = () => env().JWT_REFRESH_EXPIRES_IN || "7d";
export const SALT_ROUNDS = () => Number(env().SALT_ROUNDS) || 12;

// ── Tokens ───────────────────────────────────────────────────
const sign = (payload, tokenType, secret, expiresIn) =>
    jwt.sign({ ...payload, tokenType }, secret, { expiresIn });

const verify = (token, tokenType, secret, message) => {
    let decoded;
    try {
        decoded = jwt.verify(token, secret);
    } catch {
        throw ApiError.unauthorized(message);
    }
    if (decoded.tokenType !== tokenType) throw ApiError.unauthorized("Invalid token type");
    return decoded;
};

export const generateAccessToken = (payload) =>
    sign({ id: payload.id, role: payload.role }, "access", env().JWT_ACCESS_SECRET, JWT_EXPIRES_IN());

// The token must live exactly as long as the session it belongs to ("keep me signed in" is 30 days, otherwise 7),
// so `lifetimeMs` is passed through instead of always using the default.
export const generateRefreshToken = (payload, lifetimeMs = ms(JWT_REFRESH_EXPIRES_IN())) =>
    // `jti` makes every token unique: two sessions for one user started in the same second would otherwise be identical strings.
    sign({ id: payload.id, jti: randomUUID() }, "refresh", env().JWT_REFRESH_SECRET, Math.floor(lifetimeMs / 1000));

export const verifyAccessToken = (token) =>
    verify(token, "access", env().JWT_ACCESS_SECRET, "Invalid or expired session");

export const verifyRefreshToken = (token) =>
    verify(token, "refresh", env().JWT_REFRESH_SECRET, "Invalid or expired refresh token");

export const generateVerificationToken = (userId) =>
    sign({ userId }, "verification", env().JWT_VERIFICATION_SECRET, env().JWT_VERIFICATION_EXPIRES_IN || "30m");

export const verifyVerificationToken = (token) =>
    verify(token, "verification", env().JWT_VERIFICATION_SECRET, "Invalid or expired verification token");

export const generatePasswordResetToken = (userId) =>
    sign({ userId }, "passwordReset", env().JWT_PASSWORD_RESET_SECRET, env().JWT_PASSWORD_RESET_EXPIRES_IN || "15m");

export const verifyPasswordResetToken = (token) =>
    verify(token, "passwordReset", env().JWT_PASSWORD_RESET_SECRET, "Invalid or expired password reset token");

// ── Passwords ────────────────────────────────────────────────
export const hashPassword = (password) => bcrypt.hash(password, SALT_ROUNDS());
export const comparePassword = (password, hash) => bcrypt.compare(password, hash);

// Refresh tokens are long JWTs (bcrypt only reads the first 72 bytes), so store a
// deterministic SHA-256 digest instead: it can be looked up directly via a unique index.
export const hashToken = (token) => createHash("sha256").update(token).digest("hex");

// ── Cookies ──────────────────────────────────────────────────
export const cookieOptions = () => ({
    httpOnly: true,
    secure: env().NODE_ENV === "production",
    sameSite: env().NODE_ENV === "production" ? "none" : "lax",
});

export const setAuthCookies = (res, accessToken, refreshToken, refreshMaxAge) => {
    if (accessToken) {
        res.cookie("accessToken", accessToken, {
            ...cookieOptions(),
            maxAge: ms(env().TOKEN_MAX_AGE || "15m"),
        });
    }
    if (refreshToken) {
        res.cookie("refreshToken", refreshToken, {
            ...cookieOptions(),
            maxAge: refreshMaxAge ?? ms(env().REFRESH_TOKEN_MAX_AGE || "7d"),
        });
    }
};

export const clearAuthCookies = (res) => {
    res.clearCookie("accessToken", cookieOptions());
    res.clearCookie("refreshToken", cookieOptions());
};

// ── Users ────────────────────────────────────────────────────
// Strip every sensitive column before sending a user to the client
export const getSafeUser = (user) => {
    const {
        passwordHash,
        emailVerificationTokenHash,
        emailVerificationExpiry,
        passwordResetTokenHash,
        passwordResetExpiry,
        ...safeUser
    } = user;
    return safeUser;
};

// ── Slugs ────────────────────────────────────────────────────
export const generateSlug = (text) => slugify(text, { lower: true, strict: true, trim: true });

// Returns a slug unique within a Prisma model, e.g. "excavator-cat-320", "excavator-cat-320-1"
export const generateUniqueSlug = async (name, prismaModel, excludeId = null) => {
    if (!name) throw ApiError.badRequest("Name is required");

    const baseSlug = generateSlug(name);
    const where = { slug: { startsWith: baseSlug } };
    if (excludeId) where.id = { not: excludeId };

    const existing = await prismaModel.findMany({ where, select: { slug: true } });
    const slugs = new Set(existing.map((item) => item.slug));

    if (!slugs.has(baseSlug)) return baseSlug;

    let counter = 1;
    while (slugs.has(`${baseSlug}-${counter}`)) counter++;
    return `${baseSlug}-${counter}`;
};
