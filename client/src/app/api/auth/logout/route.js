import { createAuthRoute } from "@/lib/authRoute";

export const POST = createAuthRoute({ path: "/auth/logout", hasBody: false, forwardCookies: true, clearAlways: true });
