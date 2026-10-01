"use client";

import { useFilterTransition } from "./FilterTransitionProvider";

// Dims the (server-rendered) results while a filter change is in flight, instead of showing a full loading state.
export default function ResultsPendingOverlay({ children }) {
  const { isPending } = useFilterTransition();
  return (
    <div aria-busy={isPending} className={`transition-opacity duration-150 ${isPending ? "pointer-events-none opacity-50" : ""}`}>
      {children}
    </div>
  );
}
