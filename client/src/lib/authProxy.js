import { cookies } from "next/headers";

// Server-side base URL of the Node API
export const BACKEND_URL =
    process.env.API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    "http://localhost:8000/api/v1";

const AUTH_COOKIE_NAMES = ["accessToken", "refreshToken"];

export function parseSetCookieHeaders(headers) {
    const rawHeaders =
        typeof headers.getSetCookie === "function"
            ? headers.getSetCookie()
            : headers.get("set-cookie")
              ? [headers.get("set-cookie")]
              : [];

    const parsed = {};
    for (const header of rawHeaders) {
        if (!header) continue;
        const parts = header.split(";").map((part) => part.trim());
        const [name, ...valueParts] = parts[0].split("=");
        const value = valueParts.join("=");
        if (!name || !value) continue;

        const options = { path: "/" };
        for (const attr of parts.slice(1)) {
            if (attr.toLowerCase().startsWith("max-age=")) {
                options.maxAge = Number.parseInt(attr.split("=")[1], 10);
            }
        }
        parsed[name] = { value, options };
    }
    return parsed;
}

export function getAuthCookieHeader(cookieStore) {
    return AUTH_COOKIE_NAMES.map((name) => {
        const value = cookieStore.get(name)?.value;
        return value ? `${name}=${value}` : null;
    })
        .filter(Boolean)
        .join("; ");
}

// Matches cookieOptions() on the API (server/src/utils/helper.js) — set the SAME value there and here. Needed
// whenever the frontend and API are sibling subdomains (beta.example.com / api.example.com), since browser JS on
// the frontend calls the API directly (see src/api/api.js) and a cookie with no Domain attribute is host-only:
// visible only to whichever single host set it, even to a same-site sibling. Leave unset for local dev, where
// the frontend and API are different hosts (localhost / 127.0.0.1) that share no such domain at all.
const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN || undefined;

// Copy the API's Set-Cookie auth cookies onto the Next.js (browser-facing) domain
export async function applyAuthCookiesFromResponse(response) {
    const cookieStore = await cookies();
    const parsed = parseSetCookieHeaders(response.headers);

    for (const name of AUTH_COOKIE_NAMES) {
        const cookie = parsed[name];
        if (!cookie) continue;
        cookieStore.set(name, cookie.value, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            domain: COOKIE_DOMAIN,
            ...(cookie.options.maxAge != null && { maxAge: cookie.options.maxAge }),
        });
    }
}

export async function clearAuthCookies() {
    const cookieStore = await cookies();
    // A delete has to repeat the same domain/path the cookie was set with, or the browser sees it as clearing a
    // different (host-only) cookie and leaves the real, domain-scoped one behind.
    for (const name of AUTH_COOKIE_NAMES) cookieStore.delete({ name, path: "/", domain: COOKIE_DOMAIN });
}

export async function proxyAuthRequest({ path, method = "POST", body = null, forwardCookies = false }) {
    const cookieStore = await cookies();
    const headers = { "Content-Type": "application/json" };

    if (forwardCookies) {
        const cookieHeader = getAuthCookieHeader(cookieStore);
        if (cookieHeader) headers.Cookie = cookieHeader;
    }

    const response = await fetch(`${BACKEND_URL}${path}`, {
        method,
        headers,
        ...(body != null && { body: JSON.stringify(body) }),
    });

    const data = await response.json();
    return { response, data };
}
