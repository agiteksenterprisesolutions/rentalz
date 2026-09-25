import { NextResponse } from "next/server";
import { applyAuthCookiesFromResponse, clearAuthCookies, proxyAuthRequest } from "@/lib/authProxy";

// Builds a Next.js route handler that forwards to the Node API.
//   setCookies: copy auth cookies from the API response (login, refresh)
//   clearOnFail / clearAlways: drop local cookies (refresh failure, logout)
export const createAuthRoute = ({
    path,
    method = "POST",
    hasBody = true,
    forwardCookies = false,
    setCookies = false,
    clearOnFail = false,
    clearAlways = false,
}) =>
    async function handler(request) {
        const body = hasBody ? await request.json().catch(() => ({})) : null;
        const { response, data } = await proxyAuthRequest({ path, method, body, forwardCookies });

        if (clearAlways || (clearOnFail && !response.ok)) await clearAuthCookies();
        if (setCookies && response.ok) await applyAuthCookiesFromResponse(response);

        return NextResponse.json(data, { status: response.status });
    };
