"use client";

import Link from "next/link";
import { useState } from "react";
import { authApi } from "@/api/authApi";
import Field from "./Field";
import Notice from "./Notice";

export default function ResetPasswordForm({ token }) {
  const [error, setError] = useState(null);
  const [mismatch, setMismatch] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | saving | done

  if (!token) {
    return (
      <div className="flex flex-col gap-space-md">
        <Notice>This reset link is incomplete. Please use the link from your email, or request a new one.</Notice>
        <Link href="/forgot-password" className="btn btn-primary w-full">Request a new link</Link>
      </div>
    );
  }

  const onSubmit = async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setError(null);
    setMismatch(null);
    if (form.get("password") !== form.get("confirm")) return setMismatch("The passwords don't match.");

    setStatus("saving");
    try {
      await authApi.post("/reset-password", { token, newPassword: form.get("password") });
      setStatus("done");
    } catch (e) {
      setStatus("idle");
      setError(e.response?.data?.message || "Something went wrong. Please try again.");
    }
  };

  if (status === "done") {
    return (
      <div className="flex flex-col gap-space-md">
        <Notice tone="success">Your password has been changed. You&apos;ve been signed out everywhere, so sign in again with the new one.</Notice>
        <Link href="/login" className="btn btn-primary w-full">Sign in</Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-space-md">
      {error && (
        <Notice>
          {error} <Link href="/forgot-password" className="font-medium underline underline-offset-4">Request a new link</Link>
        </Notice>
      )}
      <Field label="New password" name="password" type="password" autoComplete="new-password" required minLength={8} hint="At least 8 characters" />
      <Field label="Confirm new password" name="confirm" type="password" autoComplete="new-password" required minLength={8} error={mismatch} />
      <button type="submit" disabled={status === "saving"} className="btn btn-primary w-full">{status === "saving" ? "Saving…" : "Change password"}</button>
    </form>
  );
}
