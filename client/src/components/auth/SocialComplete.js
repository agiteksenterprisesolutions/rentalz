"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { safeNextPath } from "@/lib/redirect";
import { useAuthStore } from "@/store/authStore";
import Notice from "./Notice";

// Last step of a social sign-in: the cookies are set, so ask the API who we are, fill the header and move on.
export default function SocialComplete({ next }) {
  const router = useRouter();
  const fetchMe = useAuthStore((s) => s.fetchMe);
  const [failed, setFailed] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    fetchMe().then(() => {
      if (useAuthStore.getState().isAuthenticated) router.replace(safeNextPath(next));
      else setFailed(true);
    });
  }, [fetchMe, router, next]);

  if (failed) {
    return (
      <div className="flex flex-col gap-space-md">
        <Notice>We couldn&apos;t finish signing you in. Please try again.</Notice>
        <Link href="/login" className="btn btn-primary w-full">Back to sign in</Link>
      </div>
    );
  }
  return <p role="status" className="type-body-md text-neutral-700">Signing you in…</p>;
}
