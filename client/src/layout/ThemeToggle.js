"use client";

import { Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";

const root = () => document.documentElement;
const getTheme = () => (root().dataset.theme === "dark" ? "dark" : "light");

// The theme lives on <html data-theme>. This store lets React read it and re-render when it changes.
// Light is the default regardless of the visitor's system setting (see THEME_SCRIPT in app/layout.js);
// dark only ever applies once someone has actually pressed this toggle.
const subscribe = (notify) => {
  window.addEventListener("themechange", notify);
  return () => window.removeEventListener("themechange", notify);
};

export default function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getTheme, () => "light");

  const toggle = () => {
    const next = getTheme() === "dark" ? "light" : "dark";
    root().dataset.theme = next;
    try { localStorage.setItem("theme", next); } catch {}
    window.dispatchEvent(new Event("themechange"));
  };

  // Both icons are rendered and CSS shows the right one, so the server HTML never disagrees with the saved theme.
  return (
    <button type="button" onClick={toggle} aria-pressed={theme === "dark"} aria-label="Dark mode" className="btn btn-ghost btn-icon btn-sm rounded-full">
      <Moon aria-hidden="true" className="dark:hidden" />
      <Sun aria-hidden="true" className="hidden dark:block" />
    </button>
  );
}
