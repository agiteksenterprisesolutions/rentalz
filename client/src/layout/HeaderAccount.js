"use client";

import { ChevronDown, Heart, LayoutDashboard, LogOut, Megaphone, Receipt, Shield, UserRound } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import useDismiss from "@/hooks/useDismiss";
import { useAuthStore } from "@/store/authStore";
import { SIGN_IN_HREF } from "./navigation";

const noop = () => () => {};
// False on the server and during hydration, true afterwards, so the signed-in state never causes a mismatch.
const useHydrated = () => useSyncExternalStore(noop, () => true, () => false);

const ROLE_LABELS = { ADMIN: "Admin", MODERATOR: "Moderator", USER: "Member" };

// Confirms the saved session with the API once per page load: it drops a session that has ended and refreshes
// the name and picture (they may have changed on another device).
let sessionChecked = false;

function Avatar({ user, size = "size-9" }) {
  return (
    <span className={`relative flex ${size} shrink-0 items-center justify-center overflow-hidden rounded-full bg-amber font-display text-sm font-bold text-on-amber`}>
      {user.avatarUrl ? <Image src={user.avatarUrl} alt="" fill sizes="40px" className="object-cover" /> : (user.name?.[0] ?? "?").toUpperCase()}
    </span>
  );
}

// The signed-in "profile pill" with its drop-down, or a Sign in link for visitors.
export default function HeaderAccount() {
  const router = useRouter();
  const hydrated = useHydrated();
  const { user, role, isAuthenticated, fetchMe, logout } = useAuthStore();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(ref, open, close);

  useEffect(() => {
    if (hydrated && isAuthenticated && !sessionChecked) {
      sessionChecked = true;
      fetchMe();
    }
  }, [hydrated, isAuthenticated, fetchMe]);

  if (!hydrated || !isAuthenticated || !user) {
    return <Link href={SIGN_IN_HREF} className="hidden rounded-lg px-3 py-2 font-display text-sm font-semibold text-neutral-700 transition-colors hover:text-neutral-900 sm:inline-block">Sign in</Link>;
  }

  const isStaff = role === "ADMIN" || role === "MODERATOR";
  const links = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/ads", label: "My ads", icon: Megaphone },
    { href: "/dashboard/favourites", label: "Favourites", icon: Heart },
    { href: "/dashboard/orders", label: "Orders", icon: Receipt },
    { href: "/dashboard/profile", label: "Profile", icon: UserRound },
    ...(isStaff ? [{ href: "/admin", label: "Admin area", icon: Shield }] : []),
  ];

  const signOut = async () => {
    close();
    await logout();
    router.replace("/");
    router.refresh();
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={`Account menu for ${user.name}`}
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-2xl border border-neutral-200 bg-white p-1 pr-2 transition-colors hover:border-outline-variant sm:pr-3"
      >
        <Avatar user={user} />
        <span className="hidden max-w-40 text-left leading-tight sm:block">
          <span className="block truncate font-display text-sm font-semibold text-neutral-900">{user.name}</span>
          <span className="block text-xs text-neutral-700">{ROLE_LABELS[role] ?? "Member"}</span>
        </span>
        <ChevronDown aria-hidden="true" className={`size-4 text-neutral-700 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="panel-floating bg-white absolute right-0 top-full z-50 mt-2 w-72 max-w-[calc(100vw-2rem)] p-space-sm">
          <div className="px-3 py-2">
            <p className="truncate font-display text-base font-semibold text-neutral-900">{user.name}</p>
            <p className="type-body-sm truncate text-neutral-700">{user.email}</p>
          </div>
          <div className="divider my-space-sm" />
          <nav aria-label="Account" className="flex flex-col">
            {links.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} onClick={close} className="flex items-center gap-3 rounded-xl px-3 py-2.5 font-display text-sm font-semibold text-neutral-900 transition-colors hover:bg-neutral-900/5">
                <Icon aria-hidden="true" className="size-4 text-neutral-700" />
                {label}
              </Link>
            ))}
          </nav>
          <div className="divider my-space-sm" />
          <button type="button" onClick={signOut} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left font-display text-sm font-semibold text-neutral-900 transition-colors hover:bg-neutral-900/5">
            <LogOut aria-hidden="true" className="size-4 text-neutral-700" />
            Log out
          </button>
        </div>
      )}
    </div>
  );
}
