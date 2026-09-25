import { cookies } from "next/headers";

// Server-side fetch wrapper for Server Components / server actions.
// Returns { success, status, message, data } and never throws.
export const apiRequest = async ({
    url,
    method = "GET",
    data = null,
    params = {},
    withCredentials = false,
    cache = "force-cache",
    revalidate,
    tags = [],
    headers = {},
}) => {
    const baseUrl = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL;

    const query = new URLSearchParams(
        Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== "")
    ).toString();
    const fullUrl = `${baseUrl}${url}${query ? `?${query}` : ""}`;

    try {
        const isFormData = data instanceof FormData;
        const requestHeaders = { ...(!isFormData && data && { "Content-Type": "application/json" }), ...headers };

        if (withCredentials) {
            const cookieStore = await cookies();
            const cookieHeader = cookieStore
                .getAll()
                .filter((c) => ["accessToken", "refreshToken"].includes(c.name))
                .map((c) => `${c.name}=${c.value}`)
                .join("; ");
            if (cookieHeader) requestHeaders.Cookie = cookieHeader;
        }

        const response = await fetch(fullUrl, {
            method,
            headers: requestHeaders,
            body: data ? (isFormData ? data : JSON.stringify(data)) : undefined,
            cache,
            next: cache === "no-store" ? undefined : { ...(revalidate !== undefined && { revalidate }), ...(tags.length && { tags }) },
        });

        const result = await response.json();
        if (!response.ok) throw { status: response.status, message: result?.message, data: result };
        return result;
    } catch (error) {
        return {
            success: false,
            status: error?.status || 500,
            message: error?.message || "Something went wrong",
            data: error?.data || null,
        };
    }
};
