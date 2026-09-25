"use client";

import { ChevronDown, Menu, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { MAIN_NAV, POST_AD_HREF, SIGN_IN_HREF } from "./navigation";
import { useAuthStore } from "@/store/authStore";

const row = "rounded-xl px-4 py-3 font-display text-base font-semibold hover:bg-canvas";

// Below the lg breakpoint the main links move into this floating panel; groups open like an accordion.
export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const [group, setGroup] = useState(null);
  const signedIn = useAuthStore((s) => s.isAuthenticated);

  const close = () => setOpen(false);
  const onKeyDown = (event) => event.key === "Escape" && close();

  return (
    <div className="lg:hidden" onKeyDown={onKeyDown}>
      <button type="button" className="btn btn-ghost btn-icon btn-sm" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} aria-controls="mobile-menu" onClick={() => setOpen((v) => !v)}>
        {open ? <X /> : <Menu />}
      </button>

      {open && (
        <>
          <button type="button" aria-label="Close menu" className="scrim top-16 z-30" onClick={close} tabIndex={-1} />
          <nav id="mobile-menu" aria-label="Mobile" className="panel-floating bg-white absolute inset-x-space-md top-[4.5rem] z-40 flex max-h-[calc(100vh-6rem)] flex-col overflow-y-auto p-space-sm">
            {MAIN_NAV.map((item) =>
              item.children ? (
                <div key={item.label}>
                  <button type="button" aria-expanded={group === item.label} onClick={() => setGroup(group === item.label ? null : item.label)} className={`${row} flex w-full items-center justify-between text-left`}>
                    {item.label}
                    <ChevronDown aria-hidden="true" className={`size-4 transition-transform ${group === item.label ? "rotate-180" : ""}`} />
                  </button>
                  {group === item.label && (
                    <div className="ml-4 flex flex-col border-l border-neutral-200 pl-2">
                      {item.children.map((child) => (
                        <Link key={child.href} href={child.href} onClick={close} className="rounded-xl px-4 py-2.5 font-display text-base font-medium hover:bg-canvas">{child.label}</Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <Link key={item.href} href={item.href} onClick={close} className={row}>{item.label}</Link>
              ),
            )}
            <div className="divider my-space-sm" />
            <Link href={POST_AD_HREF} onClick={close} className="btn btn-primary mx-2 mb-2 sm:hidden">Post an ad</Link>
            {!signedIn && <Link href={SIGN_IN_HREF} onClick={close} className={`${row} sm:hidden`}>Sign in</Link>}
          </nav>
        </>
      )}
    </div>
  );
}
