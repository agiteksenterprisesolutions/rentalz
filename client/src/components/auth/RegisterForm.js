"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuthStore } from "@/store/authStore";
import Field from "./Field";
import Notice from "./Notice";
import ResendVerification from "./ResendVerification";
import Turnstile from "./Turnstile";

export default function RegisterForm() {
  const { register, isLoading } = useAuthStore();
  const [error, setError] = useState(null);
  const [done, setDone] = useState(null); // { email, emailSent }
  const [captchaToken, setCaptchaToken] = useState("");

  const onSubmit = async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setError(null);

    const email = form.get("email").trim();
    const result = await register({
      name: form.get("name").trim(),
      email,
      password: form.get("password"),
      ...(form.get("phone").trim() && { phone: form.get("phone").trim() }),
      ...(captchaToken && { captchaToken }),
    });
    if (result.ok) setDone({ email, emailSent: result.emailSent });
    else setError(result.message);
  };

  if (done) {
    return (
      <div className="flex flex-col gap-space-md">
        <Notice tone="success">
          {done.emailSent
            ? <>We&apos;ve sent a verification link to <strong>{done.email}</strong>. Open it to activate your account, then sign in.</>
            : <>Your account is created, but we couldn&apos;t send the verification email just now. Request a new link below.</>}
        </Notice>
        <ResendVerification email={done.email} />
      </div>
    );
  }

  // Two columns from the sm breakpoint keep the form short enough for one screen. The password field has a show/hide
  // toggle, so there's no separate "confirm password" box.
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-space-sm">
      <Notice>{error}</Notice>
      <div className="grid gap-space-sm sm:grid-cols-2">
        <Field label="Full name" name="name" autoComplete="name" required maxLength={100} />
        <Field label="Email" name="email" type="email" autoComplete="email" required />
        <Field label="Phone (optional)" name="phone" type="tel" autoComplete="tel" placeholder="+971 50 123 4567" />
        <Field label="Password" name="password" type="password" autoComplete="new-password" required minLength={8} hint="At least 8 characters" />
      </div>
      <p className="type-body-sm text-neutral-700">
        By creating an account you agree to our <Link href="/terms" className="font-medium underline underline-offset-4">terms</Link> and{" "}
        <Link href="/privacy-policy" className="font-medium underline underline-offset-4">privacy policy</Link>.
      </p>
      <Turnstile onToken={setCaptchaToken} />
      <button type="submit" disabled={isLoading} className="btn btn-primary w-full">{isLoading ? "Creating account…" : "Create account"}</button>
    </form>
  );
}
