"use client";

import { Heart, LayoutDashboard, LogOut, Megaphone, Receipt, Search, Shield, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";

const LINKS = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/ads", label: "My ads", icon: Megaphone },
  { href: "/dashboard/favourites", label: "Favourites", icon: Heart },
  { href: "/dashboard/searches", label: "Saved searches", icon: Search },
  { href: "/dashboard/orders", label: "Orders", icon: Receipt },
  { href: "/dashboard/profile", label: "Profile", icon: UserRound },
];

// Frame for every signed-in page. It re-checks the session with the API on load (the cookie alone can be stale)
// and sends the visitor to sign in if it has ended.
export default function DashboardShell({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { fetchMe, logout, user, role } = useAuthStore();

  useEffect(() => {
    fetchMe().then(() => {
      if (!useAuthStore.getState().isAuthenticated) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    });
    // Run once per visit to the dashboard, not on every page change inside it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signOut = async () => {
    await logout();
    router.replace("/");
  };

  return (
    <div className="container-page grid gap-space-lg py-space-xl lg:grid-cols-[14rem_1fr]">
      <aside className="lg:sticky lg:top-24 lg:self-start">
        {user && <p className="type-body-sm mb-space-sm truncate text-neutral-700">Signed in as <strong className="text-neutral-900">{user.name}</strong></p>}
        <nav aria-label="Account" className="flex gap-1 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible">
          {LINKS.map(({ href, label, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex shrink-0 items-center gap-2 rounded-control px-3 py-2.5 font-display text-sm font-semibold transition-colors ${active ? "bg-neutral-900 text-white" : "text-neutral-700 hover:bg-neutral-900/5 hover:text-neutral-900"}`}
              >
                <Icon aria-hidden="true" className="size-4" />
                {label}
              </Link>
            );
          })}
          {(role === "ADMIN" || role === "MODERATOR") && (
            <Link href="/admin" className="flex shrink-0 items-center gap-2 rounded-control px-3 py-2.5 font-display text-sm font-semibold text-neutral-700 hover:bg-neutral-900/5 hover:text-neutral-900">
              <Shield aria-hidden="true" className="size-4" />
              Admin area
            </Link>
          )}
          <button type="button" onClick={signOut} className="flex shrink-0 items-center gap-2 rounded-control px-3 py-2.5 text-left font-display text-sm font-semibold text-neutral-700 hover:bg-neutral-900/5 hover:text-neutral-900">
            <LogOut aria-hidden="true" className="size-4" />
            Sign out
          </button>
        </nav>
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
