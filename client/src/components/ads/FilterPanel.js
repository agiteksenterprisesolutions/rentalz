"use client";

import { SlidersHorizontal } from "lucide-react";
import { useEffect, useRef } from "react";

// Native <details> toggle on phones; always open from the `lg` breakpoint up, where the summary is hidden.
// The form is rendered on the server, so without JavaScript the toggle still works (closed on desktop is the only gap).
export default function FilterPanel({ activeCount, children }) {
  const ref = useRef(null);

  useEffect(() => {
    const query = window.matchMedia("(min-width: 1024px)");
    const sync = () => {
      if (ref.current) ref.current.open = query.matches || activeCount > 0;
    };
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, [activeCount]);

  return (
    <details ref={ref} className="card lg:sticky lg:top-24">
      <summary className="flex cursor-pointer list-none items-center gap-2 p-space-md lg:pointer-events-none">
        <SlidersHorizontal aria-hidden="true" className="size-5" />
        <span className="type-headline-sm">Filters{activeCount > 0 && ` (${activeCount})`}</span>
      </summary>
      {children}
    </details>
  );
}
