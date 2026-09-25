"use client";

import { BarChart3, Boxes, Building2, Car, FolderTree, Inbox, LayoutDashboard, LogOut, Megaphone, Receipt, ScrollText, Settings, Shield, Users } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Logo from "@/layout/Logo";
import { useAuthStore } from "@/store/authStore";

// `any` lists the permissions that unlock an item (one is enough).
const LINKS = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true, any: ["report:ads", "report:sales"] },
  { href: "/admin/ads", label: "Ads", icon: Megaphone, any: ["ad:list"] },
  { href: "/admin/users", label: "Users", icon: Users, any: ["user:list"] },
  { href: "/admin/orders", label: "Orders", icon: Receipt, any: ["order:list"] },
  { href: "/admin/categories", label: "Categories", icon: FolderTree, any: ["category:update"] },
  { href: "/admin/cities", label: "Cities", icon: Building2, any: ["city:manage"] },
  { href: "/admin/makes", label: "Makes", icon: Car, any: ["make:manage"] },
  { href: "/admin/packages", label: "Packages", icon: Boxes, any: ["package:update"] },
  { href: "/admin/messages", label: "Messages", icon: Inbox, any: ["contact:list"] },
  { href: "/admin/insurance", label: "Insurance leads", icon: Shield, any: ["insurance:list"] },
  { href: "/admin/audit", label: "Audit log", icon: ScrollText, any: ["audit:list"] },
  { href: "/admin/seo", label: "SEO settings", icon: Settings, any: ["setting:read"] },
];

export default function AdminShell({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { fetchMe, logout, permissions, role, user } = useAuthStore();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    fetchMe().then(() => {
      const { isAuthenticated, role: current } = useAuthStore.getState();
      if (!isAuthenticated) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      else if (current !== "ADMIN" && current !== "MODERATOR") router.replace("/dashboard");
      else setReady(true);
    });
    // Once per visit to the admin area.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!ready) return <p role="status" className="p-space-xl type-body-md text-neutral-700">Loading…</p>;

  const links = LINKS.filter((l) => l.any.some((p) => permissions.includes(p)));
  const signOut = async () => {
    await logout();
    router.replace("/");
  };

  return (
    <div className="min-h-screen bg-canvas lg:grid lg:grid-cols-[15rem_1fr]">
      <aside className="border-neutral-200 bg-white lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto lg:border-r">
        <div className="flex items-center justify-between gap-3 p-space-md lg:flex-col lg:items-start">
          <Logo />
          <p className="type-label-mono-md text-neutral-700 uppercase">{role === "ADMIN" ? "Admin" : "Moderator"}</p>
        </div>
        <nav aria-label="Admin" className="flex gap-1 overflow-x-auto px-space-sm pb-space-sm lg:flex-col lg:overflow-visible">
          {links.map(({ href, label, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link key={href} href={href} aria-current={active ? "page" : undefined} className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-2.5 font-display text-sm font-semibold transition-colors ${active ? "bg-neutral-900 text-white" : "text-neutral-700 hover:bg-neutral-900/5 hover:text-neutral-900"}`}>
                <Icon aria-hidden="true" className="size-4" />
                {label}
              </Link>
            );
          })}
          <Link href="/dashboard" className="flex shrink-0 items-center gap-2 rounded-xl px-3 py-2.5 font-display text-sm font-semibold text-neutral-700 hover:bg-neutral-900/5"><BarChart3 aria-hidden="true" className="size-4" />My account</Link>
          <button type="button" onClick={signOut} className="flex shrink-0 items-center gap-2 rounded-xl px-3 py-2.5 font-display text-sm font-semibold text-neutral-700 hover:bg-neutral-900/5"><LogOut aria-hidden="true" className="size-4" />Sign out</button>
        </nav>
        {user && <p className="type-body-sm hidden truncate px-space-md pb-space-md text-neutral-700 lg:block">{user.email}</p>}
      </aside>
      <main id="content" className="min-w-0 p-space-md md:p-space-lg">{children}</main>
    </div>
  );
}
