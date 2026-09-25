"use client";

import Script from "next/script";
import { useEffect, useId, useRef } from "react";

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

// Cloudflare Turnstile widget. Renders nothing while no site key is configured (local development,
// where the API skips the check too). `onToken` gets the token, or "" when it expires.
export default function Turnstile({ onToken }) {
  const id = useId();
  const box = useRef(null);
  const widget = useRef(null);

  useEffect(() => {
    if (!SITE_KEY) return;
    let cancelled = false;
    const mount = () => {
      if (cancelled || widget.current !== null || !window.turnstile || !box.current) return;
      widget.current = window.turnstile.render(box.current, {
        sitekey: SITE_KEY,
        callback: onToken,
        "expired-callback": () => onToken(""),
        "error-callback": () => onToken(""),
      });
    };
    mount();
    window.addEventListener(`turnstile-ready-${id}`, mount);
    return () => {
      cancelled = true;
      window.removeEventListener(`turnstile-ready-${id}`, mount);
      if (widget.current !== null) window.turnstile?.remove(widget.current);
      widget.current = null;
    };
  }, [id, onToken]);

  if (!SITE_KEY) return null;
  return (
    <>
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" strategy="afterInteractive" onReady={() => window.dispatchEvent(new Event(`turnstile-ready-${id}`))} />
      <div ref={box} />
    </>
  );
}
