"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";

// Wraps pages that need a signed-in user outside the dashboard. It asks the API who is signed in, sends
// everyone else to the sign-in page (and back afterwards) and renders nothing until the answer is in.
export default function RequireSession({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const fetchMe = useAuthStore((s) => s.fetchMe);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    fetchMe().then(() => {
      if (useAuthStore.getState().isAuthenticated) setReady(true);
      else router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    });
  }, [fetchMe, router, pathname]);

  return ready ? children : <p role="status" className="container-page py-space-2xl type-body-md text-neutral-700">Loading…</p>;
}
