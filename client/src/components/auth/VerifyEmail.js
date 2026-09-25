"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { authApi } from "@/api/authApi";
import Notice from "./Notice";

// Confirms the token from the email link. It's a POST (a link scanner that only fetches the URL can't use up
// the token) and guarded by a ref so React's development double-run doesn't send it twice.
export default function VerifyEmail({ token }) {
  const [state, setState] = useState(token ? { status: "checking" } : { status: "error", message: "This verification link is incomplete." });
  const sent = useRef(false);

  useEffect(() => {
    if (!token || sent.current) return;
    sent.current = true;
    authApi
      .post("/verify-email", { token })
      .then(() => setState({ status: "done" }))
      .catch((e) => setState({ status: "error", message: e.response?.data?.message || "We couldn't verify your email." }));
  }, [token]);

  if (state.status === "checking") return <p role="status" className="type-body-md text-neutral-700">Verifying your email…</p>;
  if (state.status === "done") {
    return (
      <div className="flex flex-col gap-space-md">
        <Notice tone="success">Your email is verified. You can sign in now.</Notice>
        <Link href="/login" className="btn btn-primary w-full">Sign in</Link>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-space-md">
      <Notice>{state.message} The link may have expired or already been used. Sign in and we&apos;ll send you a new one.</Notice>
      <Link href="/login" className="btn btn-primary w-full">Go to sign in</Link>
    </div>
  );
}
