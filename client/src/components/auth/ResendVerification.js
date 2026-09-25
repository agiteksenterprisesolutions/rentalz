"use client";

import { useState } from "react";
import { authApi } from "@/api/authApi";
import Notice from "./Notice";

// Asks the API for a fresh verification link. The API answers the same for every address, so this reveals nothing.
export default function ResendVerification({ email }) {
  const [state, setState] = useState("idle"); // idle | sending | sent | error

  const resend = async () => {
    setState("sending");
    try {
      await authApi.post("/resend-verification", { email });
      setState("sent");
    } catch {
      setState("error");
    }
  };

  if (state === "sent") return <Notice tone="success">If that address still needs verifying, a new link is on its way. It can take a minute to arrive.</Notice>;
  return (
    <div className="flex flex-col gap-space-sm">
      {state === "error" && <Notice>We couldn&apos;t send that just now. Please try again in a few minutes.</Notice>}
      <button type="button" onClick={resend} disabled={state === "sending" || !email} className="btn btn-secondary w-full">
        {state === "sending" ? "Sending…" : "Send a new verification link"}
      </button>
    </div>
  );
}
