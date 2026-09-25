import { timingSafeEqual } from "node:crypto";
import prisma from "../config/prisma.js";
import { UserStatus } from "../generated/prisma/enums.ts";
import { getAdCredits } from "../services/credit.service.js";
import { buildAuthUrl, configuredProviders, consumeLoginCode, createLoginCode, fetchProfile, isConfigured, isProvider, newState, resolveUser } from "../services/social-auth.service.js";
import { apiResponse, asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/error.js";
import { cookieOptions, getSafeUser } from "../utils/helper.js";
import { avatarUrlOf, getPermissions, startSession } from "./auth.controller.js";

const FRONTEND = () => process.env.CORS_ORIGIN;
const STATE_COOKIE = "oauth_state";
const NEXT_COOKIE = "oauth_next";
// The state cookie has to come back on the provider's redirect (a top-level navigation), so SameSite=Lax is enough.
const flowCookie = () => ({ ...cookieOptions(), sameSite: "lax", maxAge: 10 * 60 * 1000 });

// Only same-site paths: this value ends up in a redirect.
const safeNext = (value) => (typeof value === "string" && value.startsWith("/") && !value.startsWith("//") && !value.includes("\\") ? value.slice(0, 200) : "/dashboard");

const toLogin = (res, error) => res.redirect(`${FRONTEND()}/login?error=${error}`);

const sameState = (a, b) => typeof a === "string" && typeof b === "string" && a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));

const ERROR_CODES = {
    SOCIAL_NO_EMAIL: "social_no_email",
    SOCIAL_EMAIL_UNVERIFIED: "social_unverified",
    SOCIAL_ACCOUNT_DELETED: "social_deleted",
    SOCIAL_BLOCKED: "social_blocked",
};

// GET /auth/providers: which social buttons the frontend should show
export const socialProviders = asyncHandler(async (req, res) => {
    res.set("Cache-Control", "public, max-age=300");
    return apiResponse(res, 200, true, "Providers", configuredProviders());
});

// GET /auth/:provider?next=/path: start of the flow. Remembers a random state (against forged callbacks) and where to land afterwards.
export const startSocialLogin = asyncHandler(async (req, res) => {
    const { provider } = req.params;
    if (!isProvider(provider)) throw ApiError.notFound("Unknown sign-in provider");
    if (!isConfigured(provider)) return toLogin(res, "social_unavailable");

    const state = newState();
    res.cookie(STATE_COOKIE, state, flowCookie());
    res.cookie(NEXT_COOKIE, safeNext(req.query.next), flowCookie());
    return res.redirect(buildAuthUrl(provider, state));
});

// GET /auth/:provider/callback: the provider sends the person back here
export const socialCallback = asyncHandler(async (req, res) => {
    const { provider } = req.params;
    if (!isProvider(provider)) throw ApiError.notFound("Unknown sign-in provider");

    const expected = req.cookies?.[STATE_COOKIE];
    const next = safeNext(req.cookies?.[NEXT_COOKIE]);
    res.clearCookie(STATE_COOKIE, flowCookie());
    res.clearCookie(NEXT_COOKIE, flowCookie());

    if (req.query.error) return toLogin(res, "social_cancelled"); // the person pressed Cancel at the provider
    if (!sameState(expected, req.query.state) || !req.query.code) return toLogin(res, "social_failed");

    let user;
    try {
        user = await resolveUser(provider, await fetchProfile(provider, String(req.query.code)));
    } catch (error) {
        if (ERROR_CODES[error.code]) return toLogin(res, ERROR_CODES[error.code]);
        console.error(`Sign-in with ${provider} failed: ${error.message}`);
        return toLogin(res, "social_failed");
    }

    const code = await createLoginCode(user.id);
    return res.redirect(`${FRONTEND()}/api/auth/social?${new URLSearchParams({ code, next })}`);
});

// POST /auth/social/exchange { code }: the frontend trades the one-time code for a session (same response as login)
export const exchangeSocialCode = asyncHandler(async (req, res) => {
    const userId = await consumeLoginCode(req.body?.code);
    const user = await prisma.user.findFirst({ where: { id: userId, deletedAt: null } });
    if (!user || user.status !== UserStatus.ACTIVE || !user.emailVerified) throw ApiError.unauthorized("This account cannot sign in");

    await startSession(req, res, user);
    return apiResponse(res, 200, true, "Logged in successfully", {
        user: { ...getSafeUser(user), adCredits: await getAdCredits(user.id), avatarUrl: await avatarUrlOf(user.id) },
        permissions: await getPermissions(user.role),
    });
});
