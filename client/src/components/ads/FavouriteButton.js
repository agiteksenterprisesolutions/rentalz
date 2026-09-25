"use client";

import { Heart } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";
import { useAuthStore } from "@/store/authStore";
import { useFavouriteStore } from "@/store/favouriteStore";

const noop = () => () => {};

// Heart toggle. Signed-out visitors get a link to sign in that brings them back to this page.
export default function FavouriteButton({ adId, title, className = "", onChange, withLabel = false }) {
  const pathname = usePathname();
  const hydrated = useSyncExternalStore(noop, () => true, () => false);
  const signedIn = useAuthStore((s) => s.isAuthenticated);
  const saved = useFavouriteStore((s) => s.ids.has(adId));
  const load = useFavouriteStore((s) => s.load);
  const toggle = useFavouriteStore((s) => s.toggle);

  useEffect(() => {
    if (hydrated && signedIn) load();
  }, [hydrated, signedIn, load]);

  const base = `z-10 inline-flex items-center justify-center gap-2 rounded-full border border-neutral-200 bg-white text-neutral-900 shadow-resting transition-colors hover:border-neutral-900 ${withLabel ? "h-10 px-4 font-display text-sm font-semibold" : "size-9"} ${className}`;
  const icon = <Heart aria-hidden="true" className={`size-4 ${hydrated && signedIn && saved ? "fill-amber-deep text-amber-deep" : ""}`} />;

  if (!hydrated || !signedIn) {
    return (
      <Link href={`/login?next=${encodeURIComponent(pathname)}`} aria-label={`Sign in to save ${title}`} className={base}>
        {icon}
        {withLabel && "Save"}
      </Link>
    );
  }
  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={saved ? `Remove ${title} from favourites` : `Save ${title} to favourites`}
      onClick={async () => {
        const ok = await toggle(adId);
        if (ok) onChange?.(!saved);
      }}
      className={base}
    >
      {icon}
      {withLabel && (saved ? "Saved" : "Save")}
    </button>
  );
}
