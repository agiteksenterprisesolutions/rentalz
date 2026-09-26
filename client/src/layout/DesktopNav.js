"use client";

import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { useCallback, useRef, useState } from "react";
import useDismiss from "@/hooks/useDismiss";
import { MAIN_NAV } from "./navigation";

const itemClass = "rounded-control px-3 py-2 font-display text-sm font-semibold text-neutral-700 transition-colors hover:bg-neutral-900/5 hover:text-neutral-900";

// A button that opens a small panel of links (disclosure pattern: the button reports aria-expanded).
function Dropdown({ item }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(ref, open, close);

  return (
    <div ref={ref} className="relative">
      <button type="button" aria-expanded={open} aria-haspopup="true" onClick={() => setOpen((v) => !v)} className={`${itemClass} inline-flex items-center gap-1 ${open ? "bg-neutral-900/5 text-neutral-900" : ""}`}>
        {item.label}
        <ChevronDown aria-hidden="true" className={`size-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="panel-floating bg-white absolute left-0 top-full z-50 mt-2 flex w-80 flex-col p-space-sm">
          {item.children.map((child) => (
            <Link key={child.href} href={child.href} onClick={close} className="rounded-control px-3 py-2.5 transition-colors hover:bg-neutral-900/5">
              <span className="block font-display text-sm font-semibold text-neutral-900">{child.label}</span>
              {child.text && <span className="type-body-sm block text-neutral-700">{child.text}</span>}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function DesktopNav() {
  return (
    <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
      {MAIN_NAV.map((item) => (item.children ? <Dropdown key={item.label} item={item} /> : <Link key={item.href} href={item.href} className={itemClass}>{item.label}</Link>))}
    </nav>
  );
}
