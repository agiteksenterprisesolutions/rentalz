import { NextResponse } from "next/server";
import { applyAuthCookiesFromResponse, proxyAuthRequest } from "@/lib/authProxy";
import { safeNextPath } from "@/lib/redirect";

// Where the API sends people after a successful Google / Facebook sign-in, with a one-time `code` in the address.
// The code is traded for the real cookies here, on the server, so tokens never appear in a URL or in page JavaScript.
export async function GET(request) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const fail = () => NextResponse.redirect(new URL("/login?error=social_failed", origin));
  if (!code) return fail();

  const { response } = await proxyAuthRequest({ path: "/auth/social/exchange", body: { code } }).catch(() => ({ response: null }));
  if (!response?.ok) return fail();

  await applyAuthCookiesFromResponse(response);
  const next = safeNextPath(searchParams.get("next"));
  return NextResponse.redirect(new URL(`/login/complete?next=${encodeURIComponent(next)}`, origin));
}
