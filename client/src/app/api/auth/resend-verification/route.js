import { createAuthRoute } from "@/lib/authRoute";

export const POST = createAuthRoute({ path: "/auth/resend-verification" });
