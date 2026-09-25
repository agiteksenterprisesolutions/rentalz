"use client";

import { useEffect } from "react";

// Closes a pop-up when the visitor clicks outside `ref` or presses Escape.
export default function useDismiss(ref, open, close) {
  useEffect(() => {
    if (!open) return;
    const onPointer = (event) => ref.current && !ref.current.contains(event.target) && close();
    const onKey = (event) => event.key === "Escape" && close();
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [ref, open, close]);
}
