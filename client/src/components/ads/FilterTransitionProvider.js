"use client";

import { createContext, useContext, useTransition } from "react";

// Shared between AdFilters (which starts the transition on every filter change) and ResultsPendingOverlay
// (which dims the results while one is in flight) so a filter change never needs a full page navigation.
const FilterTransitionContext = createContext(null);

export function FilterTransitionProvider({ children }) {
  const [isPending, startTransition] = useTransition();
  return <FilterTransitionContext.Provider value={{ isPending, startTransition }}>{children}</FilterTransitionContext.Provider>;
}

export const useFilterTransition = () => useContext(FilterTransitionContext);
