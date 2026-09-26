"use client";

import { ArrowUp } from "lucide-react";
import { useSyncExternalStore } from "react";

const SHOW_AFTER_PX = 480;

// Reads "has the visitor scrolled far enough?" from the window, and re-renders only when the answer flips.
const subscribe = (notify) => {
  window.addEventListener("scroll", notify, { passive: true });
  return () => window.removeEventListener("scroll", notify);
};
const getSnapshot = () => window.scrollY > SHOW_AFTER_PX;

// Bottom right on every page, stacked above the assistant's launcher. It stays in the page (so it can fade)
// but is skipped by keyboards and screen readers while hidden.
export default function BackToTop() {
  const visible = useSyncExternalStore(subscribe, getSnapshot, () => false);

  const toTop = () => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
  };

  return (
    <button
      type="button"
      onClick={toTop}
      aria-label="Back to top"
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
      className={`fixed bottom-22 right-5 z-40 flex size-12 items-center justify-center rounded-control border border-neutral-200 bg-white text-neutral-900 shadow-hover transition duration-200 hover:border-amber hover:bg-amber hover:text-on-amber focus-visible:outline-2 md:bottom-28 md:right-8 ${visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0"}`}
    >
      <ArrowUp aria-hidden="true" className="size-5" />
    </button>
  );
}
