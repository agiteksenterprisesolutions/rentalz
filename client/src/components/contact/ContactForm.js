"use client";

import { useState } from "react";
import { api } from "@/api/api";
import Field from "@/components/auth/Field";
import Notice from "@/components/auth/Notice";
import Turnstile from "@/components/auth/Turnstile";
import { apiError } from "@/hooks/useFetch";
import { useAuthStore } from "@/store/authStore";

export default function ContactForm() {
  const user = useAuthStore((s) => s.user); // prefilled for signed-in visitors; still editable
  const [state, setState] = useState({ status: "idle" });
  const [captchaToken, setCaptchaToken] = useState("");

  const onSubmit = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const f = new FormData(form);
    setState({ status: "sending" });
    try {
      const { data } = await api.post("/contact", {
        name: f.get("name").trim(),
        email: f.get("email").trim(),
        message: f.get("message").trim(),
        ...(captchaToken && { captchaToken }),
      });
      form.reset();
      setState({ status: "sent", message: data.message });
    } catch (e) {
      setState({ status: "error", message: apiError(e) });
    }
  };

  if (state.status === "sent") return <Notice tone="success">{state.message} We usually reply within one working day.</Notice>;

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-space-md">
      {state.status === "error" && <Notice>{state.message}</Notice>}
      <div className="grid gap-space-md sm:grid-cols-2">
        <Field label="Your name" name="name" autoComplete="name" required maxLength={191} defaultValue={user?.name ?? ""} key={`n-${user?.id}`} />
        <Field label="Email" name="email" type="email" autoComplete="email" required maxLength={191} defaultValue={user?.email ?? ""} key={`e-${user?.id}`} />
      </div>
      <div>
        <label htmlFor="message" className="label">Message</label>
        <textarea id="message" name="message" rows={6} required minLength={10} maxLength={5000} className="textarea" placeholder="How can we help?" />
      </div>
      <Turnstile onToken={setCaptchaToken} />
      <button type="submit" disabled={state.status === "sending"} className="btn btn-primary self-start">{state.status === "sending" ? "Sending…" : "Send message"}</button>
    </form>
  );
}
