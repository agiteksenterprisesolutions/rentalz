import { timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

// Called by the API after an admin changes cities, makes or categories, so public pages show the change at once.
// Only whitelisted tags are accepted, and the shared secret must match.
const ALLOWED_TAGS = ["cities", "makes", "categories"];

const secretMatches = (given) => {
  const expected = process.env.REVALIDATE_SECRET;
  if (!expected || !given) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
};

export async function POST(request) {
  if (!secretMatches(request.headers.get("x-revalidate-secret"))) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const tags = (Array.isArray(body.tags) ? body.tags : []).filter((tag) => ALLOWED_TAGS.includes(tag));
  if (!tags.length) return NextResponse.json({ success: false, message: "No valid tags" }, { status: 400 });

  // expire: 0 means the next request waits for fresh data instead of being served the old copy.
  for (const tag of tags) revalidateTag(tag, { expire: 0 });
  return NextResponse.json({ success: true, revalidated: tags });
}
