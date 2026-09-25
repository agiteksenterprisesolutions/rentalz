"use client";

import { BookmarkPlus } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import { api } from "@/api/api";
import { apiError } from "@/hooks/useFetch";
import { useAuthStore } from "@/store/authStore";

const noop = () => () => {};

// Saves the current filters so the user can run the same search again from their dashboard.
export default function SaveSearchButton({ filters, name }) {
  const pathname = usePathname();
  const hydrated = useSyncExternalStore(noop, () => true, () => false);
  const signedIn = useAuthStore((s) => s.isAuthenticated);
  const [state, setState] = useState({ status: "idle" });

  const save = async () => {
    setState({ status: "saving" });
    try {
      await api.post("/saved-searches", { name, filters });
      setState({ status: "saved" });
    } catch (e) {
      setState({ status: "error", message: apiError(e) });
    }
  };

  if (hydrated && signedIn) {
    return (
      <div>
        <button type="button" onClick={save} disabled={state.status === "saving" || state.status === "saved"} className="btn btn-secondary btn-sm">
          <BookmarkPlus aria-hidden="true" />
          {state.status === "saved" ? "Search saved" : state.status === "saving" ? "Saving…" : "Save this search"}
        </button>
        {state.status === "saved" && <Link href="/dashboard/searches" className="type-body-sm ml-3 underline underline-offset-4">View saved searches</Link>}
        {state.status === "error" && <p role="alert" className="field-error">{state.message}</p>}
      </div>
    );
  }
  return (
    <Link href={`/login?next=${encodeURIComponent(`${pathname}?${new URLSearchParams(filters)}`)}`} className="btn btn-secondary btn-sm">
      <BookmarkPlus aria-hidden="true" />
      Sign in to save this search
    </Link>
  );
}
