import ms from "ms";
import prisma from "../config/prisma.js";
import { publicUrl } from "../services/storage.service.js";
import { UserRole, UserStatus } from "../generated/prisma/enums.ts";
import { getAdCredits } from "../services/credit.service.js";
import { sendEmailChangeNotice } from "../services/email.service.js";
import { sendPasswordResetEmail, trySendVerificationEmail } from "../services/email.service.js";
import { apiResponse, asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/error.js";
import { verifyTurnstile } from "../utils/captcha.js";
import {
    clearAuthCookies, comparePassword, generateAccessToken, generatePasswordResetToken,
    generateRefreshToken, getSafeUser, hashPassword, hashToken, JWT_REFRESH_EXPIRES_IN,
    setAuthCookies, verifyPasswordResetToken, verifyRefreshToken, verifyVerificationToken,
} from "../utils/helper.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const getPermissions = async (role) => {
    const rows = await prisma.rolePermission.findMany({ where: { role }, include: { permission: true } });
    return rows.map((rp) => rp.permission.name);
};

// Issue + persist a refresh token, set both cookies
export const startSession = async (req, res, user, refreshMaxAge = ms(process.env.REFRESH_TOKEN_MAX_AGE || "7d")) => {
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user, refreshMaxAge);

    await prisma.refreshToken.create({
        data: {
            tokenHash: hashToken(refreshToken),
            userId: user.id,
            ip: req.ip,
            userAgent: req.headers["user-agent"]?.slice(0, 255),
            expiresAt: new Date(Date.now() + refreshMaxAge),
        },
    });

    setAuthCookies(res, accessToken, refreshToken, refreshMaxAge);
};

const assertCanSignIn = async (user) => {
    if (!user.emailVerified) {
        const result = await trySendVerificationEmail(user);
        const message =
            result === "failed"
                ? "Please verify your email. We couldn't send the link just now, please try again in a few minutes."
                : "Please verify your email. We've sent you a verification link.";
        throw ApiError.forbidden(message, "EMAIL_NOT_VERIFIED");
    }
    if (user.status !== UserStatus.ACTIVE) {
        throw ApiError.unauthorized("Your account is not active. Please contact support.");
    }
};

export const registerUser = asyncHandler(async (req, res) => {
    const { name, email, password, phone, captchaToken } = req.body;

    if (!name || !email || !password) throw ApiError.badRequest("Name, email and password are required");
    if (!EMAIL_RE.test(email)) throw ApiError.badRequest("Invalid email address");
    if (password.length < 8) throw ApiError.badRequest("Password must be at least 8 characters long");

    await verifyTurnstile(captchaToken, req.ip);

    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) throw ApiError.conflict("User already exists with this email");

    const user = await prisma.user.create({
        data: {
            name: name.trim(),
            email: email.toLowerCase(),
            phone: phone || null,
            passwordHash: await hashPassword(password),
            role: UserRole.USER,
            status: UserStatus.PENDING,
            profile: { create: {} }, // legacy: User::created hook created the profile
        },
    });

    // The account exists either way; a mail problem must not fail registration (login offers a resend).
    const emailResult = await trySendVerificationEmail(user);
    const message =
        emailResult === "failed"
            ? "Registered. We couldn't send the verification email yet, sign in to get a new link."
            : "Registered. A verification email has been sent.";

    return apiResponse(res, 201, true, message, { user: getSafeUser(user), verificationEmailSent: emailResult !== "failed" });
});

// Public "resend the link" — identical response for every address so accounts can't be enumerated
export const resendVerification = asyncHandler(async (req, res) => {
    const { email } = req.body;
    if (!email) throw ApiError.badRequest("Email is required");

    const user = await prisma.user.findFirst({ where: { email: email.toLowerCase(), deletedAt: null, emailVerified: false } });
    if (user && user.status !== UserStatus.BLOCKED) await trySendVerificationEmail(user);

    return apiResponse(res, 200, true, "If that account needs verification, a new link has been sent.");
});

export const verifyEmail = asyncHandler(async (req, res) => {
    const { token } = req.body;
    if (!token) throw ApiError.badRequest("Verification token is required");

    const decoded = verifyVerificationToken(token);

    const user = await prisma.user.findFirst({
        where: { id: decoded.userId, emailVerificationTokenHash: hashToken(token), emailVerificationExpiry: { gt: new Date() } },
    });
    if (!user) throw ApiError.badRequest("Invalid or expired verification token");

    await prisma.user.update({
        where: { id: user.id },
        data: {
            emailVerified: true,
            status: UserStatus.ACTIVE,
            emailVerificationTokenHash: null,
            emailVerificationExpiry: null,
        },
    });

    return apiResponse(res, 200, true, "Email verified successfully");
});

export const loginUser = asyncHandler(async (req, res) => {
    const { email, password, rememberMe, captchaToken } = req.body;
    if (!email || !password) throw ApiError.badRequest("Email and password are required");

    await verifyTurnstile(captchaToken, req.ip);

    const user = await prisma.user.findFirst({ where: { email: email.toLowerCase(), deletedAt: null } });

    // Same message for unknown user / no password / wrong password (no account enumeration)
    if (!user?.passwordHash || !(await comparePassword(password, user.passwordHash))) {
        throw ApiError.unauthorized("Invalid email or password");
    }

    await assertCanSignIn(user);

    await startSession(req, res, user, rememberMe ? ms("30d") : undefined);

    return apiResponse(res, 200, true, "Logged in successfully", {
        user: { ...getSafeUser(user), adCredits: await getAdCredits(user.id), avatarUrl: await avatarUrlOf(user.id) },
        permissions: await getPermissions(user.role),
    });
});

export const logoutUser = asyncHandler(async (req, res) => {
    const token = req.cookies?.refreshToken;
    if (token) await prisma.refreshToken.deleteMany({ where: { tokenHash: hashToken(token) } });

    clearAuthCookies(res);
    return apiResponse(res, 200, true, "Logout successful");
});

// The profile picture URL for the header pill (null when the user has none).
export const avatarUrlOf = async (userId) => {
    const profile = await prisma.profile.findUnique({ where: { userId }, select: { avatarKey: true } });
    return publicUrl(profile?.avatarKey);
};

// Current session (used by the client on load)
export const me = asyncHandler(async (req, res) => {
    return apiResponse(res, 200, true, "OK", {
        user: { ...req.user, adCredits: await getAdCredits(req.user.id), avatarUrl: await avatarUrlOf(req.user.id) },
        permissions: await getPermissions(req.user.role),
    });
});

// Rotating refresh tokens: old one is deleted, new pair issued
export const refreshToken = asyncHandler(async (req, res) => {
    const token = req.cookies?.refreshToken;
    if (!token) throw ApiError.unauthorized("Refresh token not found");

    verifyRefreshToken(token);

    const stored = await prisma.refreshToken.findUnique({ where: { tokenHash: hashToken(token) } });
    if (!stored || stored.expiresAt < new Date()) {
        clearAuthCookies(res);
        throw ApiError.unauthorized("Invalid refresh token");
    }

    const user = await prisma.user.findFirst({ where: { id: stored.userId, deletedAt: null } });
    if (!user || user.status !== UserStatus.ACTIVE || !user.emailVerified) {
        await prisma.refreshToken.deleteMany({ where: { userId: stored.userId } });
        clearAuthCookies(res);
        throw ApiError.unauthorized("Session no longer valid");
    }

    // Rotate, keeping the session's original length: a "keep me signed in" session stays 30 days after every refresh.
    // Each refresh restarts the clock, so someone who uses the site at least once within that window stays signed in.
    const lifetime = stored.expiresAt.getTime() - stored.createdAt.getTime();
    await prisma.refreshToken.delete({ where: { id: stored.id } });
    await startSession(req, res, user, lifetime > 0 ? lifetime : ms(JWT_REFRESH_EXPIRES_IN()));

    return apiResponse(res, 200, true, "Token refreshed");
});

export const forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;
    if (!email) throw ApiError.badRequest("Email is required");

    const message = "If that email is registered, a reset link has been sent.";
    const user = await prisma.user.findFirst({ where: { email: email.toLowerCase(), deletedAt: null } });

    // Always respond identically so accounts can't be enumerated
    if (!user || user.status === UserStatus.BLOCKED) return apiResponse(res, 200, true, message);

    const resetToken = generatePasswordResetToken(user.id);
    await prisma.user.update({
        where: { id: user.id },
        data: { passwordResetTokenHash: hashToken(resetToken), passwordResetExpiry: new Date(Date.now() + 15 * 60 * 1000) },
    });
    try {
        await sendPasswordResetEmail(user, resetToken);
    } catch (error) {
        console.error(`Password reset email to user ${user.id} failed: ${error.message}`); // same response either way
    }

    return apiResponse(res, 200, true, message);
});

export const resetPassword = asyncHandler(async (req, res) => {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) throw ApiError.badRequest("Token and new password are required");
    if (newPassword.length < 8) throw ApiError.badRequest("Password must be at least 8 characters long");

    const decoded = verifyPasswordResetToken(token);

    const user = await prisma.user.findFirst({
        where: { id: decoded.userId, passwordResetTokenHash: hashToken(token), passwordResetExpiry: { gt: new Date() } },
    });
    if (!user) throw ApiError.badRequest("Invalid or expired password reset token");

    await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: await hashPassword(newPassword), passwordResetTokenHash: null, passwordResetExpiry: null },
    });
    await prisma.refreshToken.deleteMany({ where: { userId: user.id } }); // sign out everywhere

    return apiResponse(res, 200, true, "Password reset. Please log in with your new password.");
});

export const changePassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) throw ApiError.badRequest("Old and new password are required");
    if (newPassword.length < 8) throw ApiError.badRequest("Password must be at least 8 characters long");
    if (oldPassword === newPassword) throw ApiError.badRequest("New password must be different");

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user?.passwordHash || !(await comparePassword(oldPassword, user.passwordHash))) {
        throw ApiError.unauthorized("Invalid old password");
    }

    await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(newPassword) } });
    await prisma.refreshToken.deleteMany({ where: { userId: user.id } });
    clearAuthCookies(res);

    return apiResponse(res, 200, true, "Password updated. Please log in again.");
});

// POST /auth/confirm-email-change  { token } — opened from the link sent to the NEW address.
// Possession of that mailbox is the authentication, so no session is required. Refresh tokens are revoked afterwards
// because the email is the sign-in identity.
export const confirmEmailChange = asyncHandler(async (req, res) => {
    const token = String(req.body?.token ?? "");
    if (!token) throw ApiError.badRequest("Confirmation token is required");

    const request = await prisma.emailChangeRequest.findFirst({
        where: { tokenHash: hashToken(token), expiresAt: { gt: new Date() }, user: { deletedAt: null } },
        include: { user: true },
    });
    if (!request) throw ApiError.badRequest("Invalid or expired confirmation link");

    const { user, newEmail } = request;
    try {
        await prisma.$transaction([
            prisma.user.update({
                where: { id: user.id },
                data: { email: newEmail, emailVerified: true, ...(user.status === UserStatus.PENDING && { status: UserStatus.ACTIVE }) },
            }),
            prisma.emailChangeRequest.delete({ where: { userId: user.id } }),
            prisma.refreshToken.deleteMany({ where: { userId: user.id } }),
        ]);
    } catch (error) {
        if (error.code === "P2002") throw ApiError.conflict("That email address is already in use");
        throw error;
    }

    sendEmailChangeNotice(user.email, user.name, newEmail, { changed: true }).catch((e) => console.error(`Email change notice failed: ${e.message}`));
    clearAuthCookies(res);
    return apiResponse(res, 200, true, "Email address updated. Please sign in with your new email.");
});
