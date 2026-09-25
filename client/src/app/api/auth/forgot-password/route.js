import { createAuthRoute } from "@/lib/authRoute";

export const POST = createAuthRoute({ path: "/auth/forgot-password" });
