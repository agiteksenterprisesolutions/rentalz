"use client";

import { useState } from "react";
import { authApi } from "@/api/authApi";
import Field from "./Field";
import Notice from "./Notice";
import Turnstile from "./Turnstile";

export default function ForgotPasswordForm() {
  const [state, setState] = useState({ status: "idle" }); // idle | sending | sent | error
  const [captchaToken, setCaptchaToken] = useState("");

  const onSubmit = async (event) => {
    event.preventDefault();
    const email = new FormData(event.currentTarget).get("email").trim();
    setState({ status: "sending" });
    try {
      const { data } = await authApi.post("/forgot-password", { email, ...(captchaToken && { captchaToken }) });
      setState({ status: "sent", message: data.message });
    } catch (e) {
      setState({ status: "error", message: e.response?.data?.message || "Something went wrong. Please try again." });
    }
  };

  if (state.status === "sent") return <Notice tone="success">{state.message || "If an account exists for that email, a reset link is on its way."} The link expires in 15 minutes.</Notice>;

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-space-md">
      {state.status === "error" && <Notice>{state.message}</Notice>}
      <Field label="Email" name="email" type="email" autoComplete="email" required />
      <Turnstile onToken={setCaptchaToken} />
      <button type="submit" disabled={state.status === "sending"} className="btn btn-primary w-full">{state.status === "sending" ? "Sending…" : "Send reset link"}</button>
    </form>
  );
}
