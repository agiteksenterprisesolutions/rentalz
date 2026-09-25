"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Field from "@/components/auth/Field";
import Notice from "@/components/auth/Notice";
import { PageHeading } from "@/components/dashboard/parts";
import { useAuthStore } from "@/store/authStore";
import { api, useRun } from "./parts";

// 14 characters from an alphabet without look-alikes (no 0/O, 1/l/I), drawn with the browser's secure random source.
const generatePassword = () => {
  const alphabet = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint32Array(14));
  return [...bytes].map((n) => alphabet[n % alphabet.length]).join("");
};

export default function AdminNewUser() {
  const router = useRouter();
  const can = useAuthStore((s) => s.can);
  const { busy, error, run } = useRun();
  const [password, setPassword] = useState("");
  const [created, setCreated] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const body = { name: f.get("name").trim(), email: f.get("email").trim(), phone: f.get("phone").trim(), password, role: f.get("role") || "USER" };
    const { ok, result } = await run(() => api.post("/admin/users", body));
    if (ok) setCreated({ ...result.data.data, password });
  };

  if (created) {
    return (
      <>
        <PageHeading title="User created" />
        <div className="flex max-w-xl flex-col gap-space-md">
          <Notice tone="success">{created.name} can sign in right away. Their email is already marked as verified.</Notice>
          <div className="card flex flex-col gap-space-sm p-space-lg">
            <p className="type-label-mono-md text-neutral-700 uppercase">Sign-in details to share</p>
            <p className="type-body-md">Email: <strong>{created.email}</strong></p>
            <p className="type-body-md">Password: <strong className="font-mono">{created.password}</strong></p>
            <p className="type-body-sm text-neutral-700">This password isn&apos;t shown again and we don&apos;t email it. Ask them to change it after signing in (Profile, then Password).</p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => router.push(`/admin/users/${created.id}`)} className="btn btn-primary">Open user</button>
            <button type="button" onClick={() => { setCreated(null); setPassword(""); }} className="btn btn-secondary">Create another</button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeading title="New user" subtitle="Create an account directly. It starts active and verified." action={<Link href="/admin/users" className="btn btn-ghost btn-sm">All users</Link>} />
      <form onSubmit={submit} className="card flex max-w-xl flex-col gap-space-md p-space-lg">
        {error && <Notice>{error}</Notice>}
        <Field label="Full name" name="name" required maxLength={191} autoComplete="off" />
        <Field label="Email" name="email" type="email" required maxLength={191} autoComplete="off" />
        <Field label="Phone (optional)" name="phone" type="tel" placeholder="+971 50 123 4567" autoComplete="off" />
        <div>
          <Field label="Password" name="password" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" hint="At least 8 characters" />
          <button type="button" onClick={() => setPassword(generatePassword())} className="btn btn-ghost btn-sm mt-space-sm">Generate a strong password</button>
        </div>
        {can("user:change-role") && (
          <div>
            <label htmlFor="role" className="label">Role</label>
            <select id="role" name="role" defaultValue="USER" className="select">
              <option value="USER">User</option>
              <option value="MODERATOR">Moderator (reviews ads and messages)</option>
              <option value="ADMIN">Admin (full access)</option>
            </select>
          </div>
        )}
        <button type="submit" disabled={busy} className="btn btn-primary self-start">{busy ? "Creating…" : "Create user"}</button>
      </form>
    </>
  );
}
