import { createAuthRoute } from "@/lib/authRoute";

export const POST = createAuthRoute({ path: "/auth/refresh-token", hasBody: false, forwardCookies: true, setCookies: true, clearOnFail: true });
