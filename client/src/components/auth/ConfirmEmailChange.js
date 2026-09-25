"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { authApi } from "@/api/authApi";
import Notice from "./Notice";

// Same pattern as VerifyEmail: a POST from the email link's token, sent once.
export default function ConfirmEmailChange({ token }) {
  const [state, setState] = useState(token ? { status: "checking" } : { status: "error", message: "This link is incomplete." });
  const sent = useRef(false);

  useEffect(() => {
    if (!token || sent.current) return;
    sent.current = true;
    authApi
      .post("/confirm-email-change", { token })
      .then(() => setState({ status: "done" }))
      .catch((e) => setState({ status: "error", message: e.response?.data?.message || "We couldn't confirm the change." }));
  }, [token]);

  if (state.status === "checking") return <p role="status" className="type-body-md text-neutral-700">Confirming your new email…</p>;
  if (state.status === "done") {
    return (
      <div className="flex flex-col gap-space-md">
        <Notice tone="success">Your email address has been changed. For your security you&apos;ve been signed out, so sign in with the new address.</Notice>
        <Link href="/login" className="btn btn-primary w-full">Sign in</Link>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-space-md">
      <Notice>{state.message} The link may have expired. Start the change again from your profile.</Notice>
      <Link href="/dashboard/profile" className="btn btn-primary w-full">Go to profile</Link>
    </div>
  );
}
