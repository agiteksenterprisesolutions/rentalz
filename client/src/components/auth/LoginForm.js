"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { safeNextPath } from "@/lib/redirect";
import { useAuthStore } from "@/store/authStore";
import Field from "./Field";
import Notice from "./Notice";
import ResendVerification from "./ResendVerification";
import Turnstile from "./Turnstile";

export default function LoginForm({ next }) {
  const router = useRouter();
  const target = safeNextPath(next);
  const { login, isLoading, isAuthenticated } = useAuthStore();
  const [email, setEmail] = useState("");
  const [error, setError] = useState(null);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");

  // Someone who is already signed in has no reason to see this page.
  useEffect(() => {
    if (isAuthenticated) router.replace(target);
  }, [isAuthenticated, router, target]);

  const onSubmit = async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setError(null);
    setNeedsVerification(false);

    const result = await login({
      email: form.get("email").trim(),
      password: form.get("password"),
      rememberMe: form.get("rememberMe") === "on",
      ...(captchaToken && { captchaToken }),
    });

    if (result.ok) return router.replace(target);
    setError(result.message);
    setNeedsVerification(result.code === "EMAIL_NOT_VERIFIED");
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-space-sm">
      <Notice>{error}</Notice>
      <Field label="Email" name="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      <Field label="Password" name="password" type="password" autoComplete="current-password" required />
      <div className="flex items-center justify-between gap-3">
        <label className="check-row">
          <input type="checkbox" name="rememberMe" className="checkbox" />
          <span className="type-body-sm">Keep me signed in</span>
        </label>
        <Link href="/forgot-password" className="type-body-sm font-medium underline underline-offset-4">Forgot password?</Link>
      </div>
      <Turnstile onToken={setCaptchaToken} />
      <button type="submit" disabled={isLoading} className="btn btn-primary w-full">{isLoading ? "Signing in…" : "Sign in"}</button>
      {needsVerification && <ResendVerification email={email.trim()} />}
    </form>
  );
}
