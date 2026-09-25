import { ApiError } from "./error.js";

// Verify a Cloudflare Turnstile token server-side
export const verifyTurnstile = async (token, ip) => {
    // Skip only when no secret is configured (local dev)
    if (!process.env.TURNSTILE_SECRET_KEY) return true;
    if (!token) throw ApiError.badRequest("Captcha token is required");

    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            secret: process.env.TURNSTILE_SECRET_KEY,
            response: token,
            ...(ip && { remoteip: ip }),
        }),
    });
    const body = await res.json();
    if (!body.success) throw ApiError.badRequest("Captcha verification failed");
    return true;
};
