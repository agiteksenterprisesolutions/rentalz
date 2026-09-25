"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { api } from "@/api/api";
import Field from "@/components/auth/Field";
import Notice from "@/components/auth/Notice";
import useFetch, { apiError } from "@/hooks/useFetch";
import { useAuthStore } from "@/store/authStore";
import { LoadState, PageHeading } from "./parts";

// Runs an API call and reports the outcome next to the form that started it.
function useAction() {
  const [state, setState] = useState({ status: "idle" });
  const run = async (fn, successText) => {
    setState({ status: "working" });
    try {
      const result = await fn();
      setState({ status: "done", message: successText });
      return result;
    } catch (e) {
      setState({ status: "error", message: apiError(e) });
      return null;
    }
  };
  return { state, run, busy: state.status === "working" };
}

const Result = ({ state }) => (state.status === "done" ? <Notice tone="success">{state.message}</Notice> : state.status === "error" ? <Notice>{state.message}</Notice> : null);

function Card({ title, children, description }) {
  return (
    <section className="card flex flex-col gap-space-md p-space-lg">
      <div>
        <h2 className="type-headline-sm">{title}</h2>
        {description && <p className="type-body-sm text-neutral-700">{description}</p>}
      </div>
      {children}
    </section>
  );
}

function Details({ account, reload }) {
  const { state, run, busy } = useAction();
  const p = account.profile ?? {};
  const onSubmit = async (event) => {
    event.preventDefault();
    const f = new FormData(event.currentTarget);
    const body = Object.fromEntries(["name", "phone", "firstName", "lastName", "organizationName", "aboutMe"].map((k) => [k, f.get(k).trim()]));
    if (await run(() => api.patch("/users/me", body), "Your details were saved.")) { reload(); useAuthStore.getState().fetchMe(); }
  };
  return (
    <Card title="Your details">
      <form onSubmit={onSubmit} className="flex flex-col gap-space-md">
        <Result state={state} />
        <div className="grid gap-space-md sm:grid-cols-2">
          <Field label="Display name" name="name" required defaultValue={account.name} />
          <Field label="Phone" name="phone" type="tel" defaultValue={account.phone ?? ""} />
          <Field label="First name" name="firstName" defaultValue={p.firstName ?? ""} />
          <Field label="Last name" name="lastName" defaultValue={p.lastName ?? ""} />
        </div>
        <Field label="Company (optional)" name="organizationName" defaultValue={p.organizationName ?? ""} />
        <div>
          <label htmlFor="aboutMe" className="label">About you</label>
          <textarea id="aboutMe" name="aboutMe" rows={3} maxLength={1000} defaultValue={p.aboutMe ?? ""} className="textarea" />
        </div>
        <button type="submit" disabled={busy} className="btn btn-primary self-start">{busy ? "Saving…" : "Save details"}</button>
      </form>
    </Card>
  );
}

function Avatar({ account, reload }) {
  const input = useRef(null);
  const { state, run, busy } = useAction();
  const upload = async (event) => {
    const file = event.target.files[0];
    event.target.value = "";
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return run(() => Promise.reject({ response: { data: { message: "That image is larger than 5 MB." } } }));
    const body = new FormData();
    body.append("avatar", file);
    if (await run(() => api.put("/users/me/avatar", body), "Profile picture updated.")) { reload(); useAuthStore.getState().fetchMe(); }
  };
  const url = account.profile?.avatarUrl;
  return (
    <Card title="Profile picture">
      <div className="flex items-center gap-space-md">
        <div className="relative size-20 shrink-0 overflow-hidden rounded-full border border-neutral-200 bg-surface-container-low">
          {url ? <Image src={url} alt="" fill sizes="80px" className="object-cover" /> : <span className="flex size-full items-center justify-center font-display text-2xl font-bold text-neutral-700">{account.name?.[0]?.toUpperCase()}</span>}
        </div>
        <div className="flex flex-wrap gap-2">
          <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" onChange={upload} className="sr-only" tabIndex={-1} aria-hidden="true" />
          <button type="button" onClick={() => input.current.click()} disabled={busy} className="btn btn-secondary btn-sm">{url ? "Change" : "Upload"}</button>
          {url && <button type="button" disabled={busy} onClick={async () => { if (await run(() => api.delete("/users/me/avatar"), "Profile picture removed.")) { reload(); useAuthStore.getState().fetchMe(); } }} className="btn btn-ghost btn-sm">Remove</button>}
        </div>
      </div>
      <Result state={state} />
    </Card>
  );
}

function Password() {
  const { state, run, busy } = useAction();
  const [mismatch, setMismatch] = useState(null);
  const onSubmit = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const f = new FormData(form);
    setMismatch(null);
    if (f.get("newPassword") !== f.get("confirm")) return setMismatch("The passwords don't match.");
    if (await run(() => api.post("/auth/change-password", { oldPassword: f.get("oldPassword"), newPassword: f.get("newPassword") }), "Password changed.")) form.reset();
  };
  return (
    <Card title="Password">
      <form onSubmit={onSubmit} className="flex flex-col gap-space-md">
        <Result state={state} />
        <Field label="Current password" name="oldPassword" type="password" autoComplete="current-password" required />
        <Field label="New password" name="newPassword" type="password" autoComplete="new-password" required minLength={8} hint="At least 8 characters" />
        <Field label="Confirm new password" name="confirm" type="password" autoComplete="new-password" required minLength={8} error={mismatch} />
        <button type="submit" disabled={busy} className="btn btn-primary self-start">{busy ? "Saving…" : "Change password"}</button>
      </form>
    </Card>
  );
}

function Email({ account, reload }) {
  const { state, run, busy } = useAction();
  const onSubmit = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const f = new FormData(form);
    if (await run(() => api.post("/users/me/email", { newEmail: f.get("newEmail").trim(), password: f.get("password") }), "We've sent a confirmation link to the new address. Nothing changes until you open it.")) {
      form.reset();
      reload();
    }
  };
  return (
    <Card title="Email address" description={`Current: ${account.email}`}>
      {account.pendingEmail && (
        <Notice tone="success">
          Waiting for you to confirm <strong>{account.pendingEmail}</strong>.{" "}
          <button type="button" className="font-medium underline underline-offset-4" onClick={async () => (await run(() => api.delete("/users/me/email"), "Email change cancelled.")) && reload()}>Cancel change</button>
        </Notice>
      )}
      <form onSubmit={onSubmit} className="flex flex-col gap-space-md">
        <Result state={state} />
        <Field label="New email" name="newEmail" type="email" autoComplete="email" required />
        <Field label="Current password" name="password" type="password" autoComplete="current-password" required hint="Confirms it's really you" />
        <button type="submit" disabled={busy} className="btn btn-secondary self-start">{busy ? "Sending…" : "Send confirmation link"}</button>
      </form>
    </Card>
  );
}

function DeleteAccount() {
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);
  const { state, run, busy } = useAction();
  const [open, setOpen] = useState(false);
  const onSubmit = async (event) => {
    event.preventDefault();
    const password = new FormData(event.currentTarget).get("password");
    // Accounts created with Google have no password and confirm by typing DELETE instead.
    const data = password === "DELETE" ? { confirm: "DELETE" } : { password };
    if (await run(() => api.delete("/users/me", { data }), "Account deleted.")) {
      await logout();
      router.replace("/");
    }
  };
  return (
    <Card title="Delete account" description="This removes your ads, favourites and saved searches, and forfeits unused ad credits. It can't be undone.">
      {!open ? (
        <button type="button" onClick={() => setOpen(true)} className="btn btn-danger self-start">Delete my account</button>
      ) : (
        <form onSubmit={onSubmit} className="flex flex-col gap-space-md">
          <Result state={state} />
          <Field label="Enter your password to confirm" name="password" type="password" autoComplete="current-password" required hint="Signed up with Google? Type DELETE instead" />
          <div className="flex gap-2">
            <button type="submit" disabled={busy} className="btn btn-danger">{busy ? "Deleting…" : "Permanently delete"}</button>
            <button type="button" onClick={() => setOpen(false)} className="btn btn-ghost">Cancel</button>
          </div>
        </form>
      )}
    </Card>
  );
}

export default function Profile() {
  const { data, error, loading, reload } = useFetch("/users/me");
  return (
    <>
      <PageHeading title="Profile" subtitle="Your account and sign-in settings." />
      <LoadState loading={loading} error={error} onRetry={reload}>
        {data && (
          <div className="flex max-w-2xl flex-col gap-space-lg">
            <Avatar account={data} reload={reload} />
            <Details account={data} reload={reload} />
            <Email account={data} reload={reload} />
            <Password />
            <DeleteAccount />
          </div>
        )}
      </LoadState>
    </>
  );
}
