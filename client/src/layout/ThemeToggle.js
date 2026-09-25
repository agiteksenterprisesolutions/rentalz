"use client";

import { Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";

const root = () => document.documentElement;
const getTheme = () => (root().dataset.theme === "dark" ? "dark" : "light");

// The theme lives on <html data-theme>. This store lets React read it and re-render when it changes,
// including when the visitor never chose and the operating system switches between light and dark.
const subscribe = (notify) => {
  const system = window.matchMedia("(prefers-color-scheme: dark)");
  const onSystemChange = () => {
    let saved = null;
    try { saved = localStorage.getItem("theme"); } catch {}
    if (saved === "light" || saved === "dark") return; // an explicit choice wins over the system setting
    root().dataset.theme = system.matches ? "dark" : "light";
    notify();
  };
  system.addEventListener("change", onSystemChange);
  window.addEventListener("themechange", notify);
  return () => {
    system.removeEventListener("change", onSystemChange);
    window.removeEventListener("themechange", notify);
  };
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
    <button type="button" onClick={toggle} aria-pressed={theme === "dark"} aria-label="Dark mode" className="btn btn-ghost btn-icon btn-sm">
      <Moon aria-hidden="true" className="dark:hidden" />
      <Sun aria-hidden="true" className="hidden dark:block" />
    </button>
  );
}
