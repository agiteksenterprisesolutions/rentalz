import { randomBytes } from "node:crypto";
import prisma from "../config/prisma.js";
import { UserRole, UserStatus } from "../generated/prisma/enums.ts";
import { ApiError } from "../utils/error.js";
import { hashToken } from "../utils/helper.js";

// Sign in with Google or Facebook, using the standard authorization-code flow:
//   1. the browser is sent to the provider (buildAuthUrl)
//   2. the provider sends it back to our callback with a `code`
//   3. we trade the code for the person's verified profile (fetchProfile)
//   4. we find, link or create the matching account (resolveUser)
// The secrets never leave this server.

const PROVIDERS = {
    google: {
        clientId: () => process.env.GOOGLE_CLIENT_ID,
        clientSecret: () => process.env.GOOGLE_CLIENT_SECRET,
        authorizeUrl: "https://accounts.google.com/o/oauth2/v2/auth",
        scope: "openid email profile",
        extraAuthParams: { prompt: "select_account" },
    },
    facebook: {
        clientId: () => process.env.FACEBOOK_CLIENT_ID,
        clientSecret: () => process.env.FACEBOOK_CLIENT_SECRET,
        authorizeUrl: "https://www.facebook.com/v21.0/dialog/oauth",
        scope: "email,public_profile",
        extraAuthParams: {},
    },
};

export const isProvider = (name) => Object.hasOwn(PROVIDERS, name);
export const isConfigured = (name) => isProvider(name) && Boolean(PROVIDERS[name].clientId() && PROVIDERS[name].clientSecret());
export const configuredProviders = () => Object.fromEntries(Object.keys(PROVIDERS).map((name) => [name, isConfigured(name)]));

/**
 * The address the provider sends people back to. It must match one registered in the Google / Facebook console.
 * Set OAUTH_REDIRECT_BASE when the API is not at BACKEND_URL (for example behind a proxy in production).
 */
export const redirectUri = (name) => {
    const base = process.env.OAUTH_REDIRECT_BASE || `${process.env.BACKEND_URL || "http://localhost:8000"}${process.env.API_VERSION || "/api/v1"}/auth`;
    return `${base}/${name}/callback`;
};

export const buildAuthUrl = (name, state) => {
    const p = PROVIDERS[name];
    const params = new URLSearchParams({
        client_id: p.clientId(),
        redirect_uri: redirectUri(name),
        response_type: "code",
        scope: p.scope,
        state,
        ...p.extraAuthParams,
    });
    return `${p.authorizeUrl}?${params}`;
};

const getJson = async (url, init) => {
    const res = await fetch(url, { ...init, signal: AbortSignal.timeout(10000) });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(`${new URL(url).host} answered ${res.status}: ${body.error_description || body.error?.message || body.error || "no detail"}`);
    return body;
};

/** Trades the callback `code` for the person's profile: { id, email, emailVerified, name }. */
export const fetchProfile = async (name, code) => {
    const p = PROVIDERS[name];
    if (name === "google") {
        const token = await getJson("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({ code, client_id: p.clientId(), client_secret: p.clientSecret(), redirect_uri: redirectUri(name), grant_type: "authorization_code" }),
        });
        const info = await getJson("https://openidconnect.googleapis.com/v1/userinfo", { headers: { Authorization: `Bearer ${token.access_token}` } });
        return { id: String(info.sub), email: info.email, emailVerified: info.email_verified === true, name: info.name };
    }

    const token = await getJson(`https://graph.facebook.com/v21.0/oauth/access_token?${new URLSearchParams({ client_id: p.clientId(), client_secret: p.clientSecret(), redirect_uri: redirectUri(name), code })}`);
    const info = await getJson(`https://graph.facebook.com/v21.0/me?${new URLSearchParams({ fields: "id,name,email", access_token: token.access_token })}`);
    // Facebook only returns an email it has confirmed, so it counts as verified.
    return { id: String(info.id), email: info.email, emailVerified: Boolean(info.email), name: info.name };
};

const fail = (code, message) => new ApiError(message, 400, code);

/**
 * Finds the account for a provider profile, links it to an existing account with the same verified email,
 * or creates a new one. Throws an ApiError whose `code` the callback turns into a message on the sign-in page.
 */
export const resolveUser = async (name, profile) => {
    if (!profile.email) throw fail("SOCIAL_NO_EMAIL", "The provider did not share an email address");
    if (!profile.emailVerified) throw fail("SOCIAL_EMAIL_UNVERIFIED", "The provider has not verified this email address");
    const email = profile.email.trim().toLowerCase();

    let user = await prisma.user.findFirst({ where: { provider: name, providerId: profile.id, deletedAt: null } });
    if (!user) {
        const byEmail = await prisma.user.findUnique({ where: { email } });
        if (byEmail?.deletedAt) throw fail("SOCIAL_ACCOUNT_DELETED", "This email belongs to a deleted account");
        user = byEmail;
    }

    if (!user) {
        return prisma.user.create({
            data: {
                name: (profile.name || email.split("@")[0]).trim().slice(0, 191),
                email,
                provider: name,
                providerId: profile.id,
                role: UserRole.USER,
                status: UserStatus.ACTIVE,
                emailVerified: true,
                profile: { create: {} },
            },
        });
    }

    if (user.status === UserStatus.BLOCKED) throw fail("SOCIAL_BLOCKED", "This account is blocked");

    // The provider vouches for the address, so an account still waiting for email verification is now verified.
    const data = {};
    if (!user.emailVerified) data.emailVerified = true;
    if (user.status === UserStatus.PENDING) data.status = UserStatus.ACTIVE;
    // An account created with a password gets the provider recorded; later sign-ins match by id or by the same email.
    if (!user.provider || user.provider === "local") Object.assign(data, { provider: name, providerId: profile.id });
    return Object.keys(data).length ? prisma.user.update({ where: { id: user.id }, data }) : user;
};

const CODE_TTL_MS = 60 * 1000;

/** A single-use code the frontend trades for real cookies, so tokens never travel in a URL. */
export const createLoginCode = async (userId) => {
    await prisma.socialLoginCode.deleteMany({ where: { expiresAt: { lt: new Date() } } }); // tidy up
    const code = randomBytes(32).toString("hex");
    await prisma.socialLoginCode.create({ data: { codeHash: hashToken(code), userId, expiresAt: new Date(Date.now() + CODE_TTL_MS) } });
    return code;
};

/** Returns the user id for a valid, unused code, and burns the code. */
export const consumeLoginCode = async (code) => {
    const codeHash = hashToken(String(code ?? ""));
    const row = await prisma.socialLoginCode.findUnique({ where: { codeHash } });
    if (!row || row.expiresAt < new Date()) throw ApiError.unauthorized("This sign-in link has expired or was already used. Please try again.");
    // deleteMany reports how many rows it removed, so of two simultaneous requests only one gets a 1.
    const { count } = await prisma.socialLoginCode.deleteMany({ where: { id: row.id } });
    if (count !== 1) throw ApiError.unauthorized("This sign-in link has expired or was already used. Please try again.");
    return row.userId;
};

export const newState = () => randomBytes(24).toString("hex");
